import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'
import _bs58check from 'bs58check'
import { HDKey } from '@scure/bip32'
import { bech32 } from '@scure/base'

// 處理 CJS/ESM 互通：CJS 模式下會包在 { default: ... } 內
let bs58check: typeof _bs58check
if ('default' in _bs58check && typeof (_bs58check as any).default?.decode === 'function') {
  bs58check = (_bs58check as any).default
} else if (typeof _bs58check.decode === 'function') {
  bs58check = _bs58check
} else {
  throw new Error('bs58check module failed to load')
}

interface RequestBody {
  chain: string
  address: string
  apiKey?: string
}

interface ChainBalanceResponse {
  symbol: string
  amount: number
}

// xpub 版本前綴（BIP44 legacy）
const XPUB_VERSION = '0488B21E'

/**
 * 將 extended key（xpub/ypub/zpub）統一轉換為 xpub 格式，供 HDKey 解析。
 * 轉換過程中會驗證 key 結構。
 */
function toXpub(extendedKey: string): string {
  if (extendedKey.startsWith('xpub')) return extendedKey

  const decoded = bs58check.decode(extendedKey)
  if (decoded.length !== 78) {
    throw new Error('無效的 extended key 長度')
  }
  const xpubVersion = Buffer.from(XPUB_VERSION, 'hex')
  const newPayload = Buffer.concat([xpubVersion, Buffer.from(decoded.subarray(4))])
  return bs58check.encode(newPayload)
}

/**
 * 根據 extended key 前綴偵測地址類型。
 * zpub -> BIP84 (bc1...)、ypub -> BIP49 (3...)、xpub -> 依 depth 判斷。
 * 硬體錢包匯出的 depth=3 xpub 預設視為 BIP84（目前最常見）。
 */
function detectAddressType(extendedKey: string): 'bip84' | 'bip49' | 'bip44' {
  if (extendedKey.startsWith('zpub')) return 'bip84'
  if (extendedKey.startsWith('ypub')) return 'bip49'
  try {
    const decoded = bs58check.decode(extendedKey)
    if (decoded.length >= 5 && decoded[4] === 3) return 'bip84'
  } catch {}
  return 'bip44'
}

/**
 * 從壓縮公鑰衍生 P2WPKH（bech32/bc1）地址。
 */
function pubkeyToP2WPKH(pubkey: Uint8Array): string {
  const sha = crypto.createHash('sha256').update(pubkey).digest()
  const hash160 = crypto.createHash('ripemd160').update(sha).digest()
  const words = bech32.toWords(hash160)
  words.unshift(0) // witness version 0
  return bech32.encode('bc', words)
}

/**
 * 從 extended key 衍生地址，並批次查詢 blockchain.info。
 * 掃描接收鏈（m/0/i）與找零鏈（m/1/i），使用 BIP44 gap limit（20 個連續未使用地址）。
 * MAX_INDEX 用於防止無限掃描導致超過 Vercel 10 秒 timeout。
 */
async function fetchBTCFromExtendedKey(extendedKey: string): Promise<ChainBalanceResponse> {
  const xpub = toXpub(extendedKey)
  const addrType = detectAddressType(extendedKey)
  const hd = HDKey.fromExtendedKey(xpub)

  // BIP44（legacy）：blockchain.info multiaddr 原生支援衍生
  if (addrType === 'bip44') {
    const url = `https://blockchain.info/multiaddr?active=${xpub}&n=0`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`blockchain.info HTTP ${response.status}`)
    const data = await response.json()
    if (!data.wallet) throw new Error('xpub 查詢失敗')
    return { symbol: 'BTC', amount: data.wallet.final_balance / 1e8 }
  }

  // BIP49（ypub）：尚未支援，P2SH-P2WPKH 衍生邏輯不同
  if (addrType === 'bip49') {
    throw new Error('BIP49 (ypub) 尚未支援，請使用 zpub 或 xpub')
  }

  // BIP84：本地衍生 bc1... 地址後批次查詢
  const GAP_LIMIT = 20
  const MAX_INDEX = 200 // 安全上限，避免 Vercel timeout
  let totalSatoshis = 0

  for (const chain of [0, 1]) { // 0 = 接收、1 = 找零
    let consecutiveEmpty = 0
    let index = 0
    const chainKey = hd.deriveChild(chain)

    while (consecutiveEmpty < GAP_LIMIT && index < MAX_INDEX) {
      const batchSize = Math.min(GAP_LIMIT, MAX_INDEX - index)
      const batchAddresses: string[] = []
      for (let i = 0; i < batchSize; i++) {
        const child = chainKey.deriveChild(index + i)
        if (!child.publicKey) throw new Error('無法衍生公鑰')
        batchAddresses.push(pubkeyToP2WPKH(child.publicKey))
      }

      // 批次查詢 blockchain.info（多個地址以 | 分隔）
      const url = `https://blockchain.info/balance?active=${batchAddresses.join('|')}`
      const response = await fetch(url)
      if (!response.ok) throw new Error(`blockchain.info HTTP ${response.status}`)
      const data = await response.json()

      // 累計餘額並追蹤 gap
      let foundActivity = false
      for (const addr of batchAddresses) {
        const info = data[addr]
        if (info && info.n_tx > 0) {
          consecutiveEmpty = 0
          foundActivity = true
          totalSatoshis += info.final_balance || 0
        } else {
          consecutiveEmpty++
        }
      }

      index += batchSize
      if (!foundActivity) break
    }
  }

  return { symbol: 'BTC', amount: totalSatoshis / 1e8 }
}

// BTC adapter：blockchain.info + BIP84 地址衍生
async function fetchBTC(address: string): Promise<ChainBalanceResponse> {
  const isExtendedKey = /^[xyz]pub/.test(address)

  if (isExtendedKey) {
    return fetchBTCFromExtendedKey(address)
  }

  // 單一地址查詢
  const url = `https://blockchain.info/balance?active=${address}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`blockchain.info HTTP ${response.status}`)
  }

  const data = await response.json()
  const addressData = data[address]

  if (!addressData) {
    throw new Error('BTC 地址查詢失敗')
  }

  return { symbol: 'BTC', amount: addressData.final_balance / 1e8 }
}

// ETH adapter：Etherscan
async function fetchETH(address: string, apiKey?: string): Promise<ChainBalanceResponse> {
  if (!address.startsWith('0x') || address.length !== 42) {
    throw new Error('無效的 ETH 地址格式')
  }

  const params = new URLSearchParams({
    chainid: '1',
    module: 'account',
    action: 'balance',
    address,
    tag: 'latest',
  })

  if (apiKey) {
    params.append('apikey', apiKey)
  }

  const url = `https://api.etherscan.io/v2/api?${params.toString()}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Etherscan HTTP ${response.status}`)
  }

  const data = await response.json()

  if (data.status !== '1') {
    if (data.result?.includes('rate limit') || data.result?.includes('Max rate limit')) {
      throw new Error(apiKey ? 'Etherscan API 請求過於頻繁' : 'Etherscan API 請求受限，建議加入 API Key')
    }
    throw new Error(data.result || data.message || 'ETH 查詢失敗')
  }

  return { symbol: 'ETH', amount: parseFloat(data.result) / 1e18 }
}

/** 安全解析 Koios API 回傳的 lovelace 值（可能是字串或數字）。 */
function parseLovelace(value: any): number {
  const parsed = typeof value === 'string' ? parseInt(value, 10) : typeof value === 'number' ? value : 0
  return isNaN(parsed) ? 0 : parsed
}

// ADA adapter：Koios
async function fetchADA(address: string): Promise<ChainBalanceResponse> {
  const isStakeAddress = address.startsWith('stake1')

  if (isStakeAddress) {
    const response = await fetch('https://api.koios.rest/api/v1/account_info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _stake_addresses: [address] }),
    })

    if (!response.ok) {
      throw new Error(`Koios HTTP ${response.status}`)
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      throw new Error('Stake address 查詢失敗')
    }

    const info = data[0]
    // total_balance 已包含 rewards_available
    const totalLovelace = parseLovelace(info.total_balance)
    return { symbol: 'ADA', amount: totalLovelace / 1e6 }
  } else {
    const response = await fetch('https://api.koios.rest/api/v1/address_info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _addresses: [address] }),
    })

    if (!response.ok) {
      throw new Error(`Koios HTTP ${response.status}`)
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      throw new Error('ADA 地址查詢失敗')
    }

    const lovelace = parseLovelace(data[0].balance)
    return { symbol: 'ADA', amount: lovelace / 1e6 }
  }
}

const handlers: Record<string, (address: string, apiKey?: string) => Promise<ChainBalanceResponse>> = {
  BTC: fetchBTC,
  ETH: fetchETH,
  ADA: fetchADA,
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { chain, address, apiKey } = req.body as RequestBody

    if (!chain || !address) {
      return res.status(400).json({ error: 'Missing chain or address' })
    }

    const fetchFn = handlers[chain]
    if (!fetchFn) {
      return res.status(400).json({ error: `Unsupported chain: ${chain}` })
    }

    try {
      const result = await fetchFn(address, apiKey)
      return res.status(200).json({ success: true, ...result })
    } catch (error: any) {
      // 預期錯誤（地址無效、API 限流等）
      const msg = (error.message || '').replace(/apikey=[^&\s]+/gi, 'apikey=***')
      console.warn(`Chain ${chain} fetch failed:`, msg)
      return res.status(200).json({ success: false, error: error.message })
    }
  } catch (error: any) {
    // 非預期錯誤（請求格式錯誤等）
    console.error('Chain API handler error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
