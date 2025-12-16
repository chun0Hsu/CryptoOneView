import type { CryptoSymbol } from '@/types'

// 鏈上餘額查詢結果
export interface ChainBalance {
  chain: 'BTC' | 'ETH' | 'ADA'
  address: string
  balances: Array<{
    symbol: CryptoSymbol
    amount: number
  }>
}

export interface ChainBalanceResult {
  success: boolean
  data?: ChainBalance
  error?: string
}

/**
 * 查詢 BTC 地址餘額
 * 使用 Blockchain.info API（免費，無需 API Key）
 */
async function fetchBTCBalance(address: string): Promise<ChainBalanceResult> {
  try {
    // 使用 Blockchain.com API（支援所有 BTC 地址格式）
    const url = `https://blockchain.info/balance?active=${address}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // data 格式: { "address": { "final_balance": 123456, ... } }
    const addressData = data[address]

    if (!addressData) {
      throw new Error('地址查詢失敗')
    }

    const satoshis = addressData.final_balance
    const btcAmount = satoshis / 100000000 // satoshi to BTC

    return {
      success: true,
      data: {
        chain: 'BTC',
        address,
        balances: [{ symbol: 'BTC', amount: btcAmount }]
      }
    }
  } catch (error: any) {
    console.error('Failed to fetch BTC balance:', error)
    return {
      success: false,
      error: error.message || 'BTC 查詢失敗'
    }
  }
}


/**
 * 查詢 ETH 地址餘額
 * 使用 Etherscan API（免費額度，但有 rate limit）
 */
async function fetchETHBalance(
  address: string,
  apiKey?: string
): Promise<ChainBalanceResult> {
  try {
    // 驗證地址格式
    if (!address.startsWith('0x') || address.length !== 42) {
      throw new Error('無效的 ETH 地址格式')
    }

    // 建立 URL 參數
    const params = new URLSearchParams({
      chainid: '1',        
      module: 'account',
      action: 'balance',
      address: address,
      tag: 'latest'
    })

    // 如果有 API Key，加入參數
    if (apiKey) {
      params.append('apikey', apiKey)
    }

    const url = `https://api.etherscan.io/v2/api?${params.toString()}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: 網路請求失敗`)
    }

    const data = await response.json()

    // 處理 Etherscan API 錯誤
    if (data.status === '0' || data.status !== '1') {
      // 檢查是否為 rate limit 錯誤
      if (data.message === 'NOTOK' ||
        data.result?.includes('rate limit') ||
        data.result?.includes('Max rate limit reached')) {
        const errorMsg = apiKey
          ? 'Etherscan API 請求過於頻繁，請稍後再試'
          : 'Etherscan API 請求受限，建議在設定中加入 API Key'
        console.warn(errorMsg)
        return {
          success: false,
          error: errorMsg
        }
      }
      throw new Error(data.result || data.message || '查詢失敗')
    }

    const weiAmount = data.result
    const ethAmount = parseFloat(weiAmount) / 1e18 // wei to ETH

    return {
      success: true,
      data: {
        chain: 'ETH',
        address,
        balances: [{ symbol: 'ETH', amount: ethAmount }]
      }
    }
  } catch (error: any) {
    console.error('Failed to fetch ETH balance:', error)
    return {
      success: false,
      error: error.message || 'ETH 查詢失敗'
    }
  }
}


/**
 * 查詢 ADA 地址餘額
 */
async function fetchADABalance(address: string): Promise<ChainBalanceResult> {
  try {
    // 使用 Koios 免費 API（Cardano 社群維護）
    const url = `https://api.koios.rest/api/v1/address_info?_address=${address}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Koios 返回陣列，取第一筆資料
    if (!data || data.length === 0) {
      throw new Error('地址查詢失敗')
    }

    const addressInfo = data[0]
    const lovelace = parseInt(addressInfo.balance || '0')
    const adaAmount = lovelace / 1000000 // lovelace to ADA

    return {
      success: true,
      data: {
        chain: 'ADA',
        address,
        balances: [{ symbol: 'ADA', amount: adaAmount }]
      }
    }
  } catch (error: any) {
    console.error('Failed to fetch ADA balance:', error)
    return {
      success: false,
      error: error.message || 'ADA 查詢失敗'
    }
  }
}


/**
 * 統一的鏈上查詢介面
 */
export async function fetchChainBalance(
  chain: 'BTC' | 'ETH' | 'ADA',
  address: string,
  apiKey?: string  // ← 新增這個參數
): Promise<ChainBalanceResult> {
  switch (chain) {
    case 'BTC':
      return fetchBTCBalance(address)
    case 'ETH':
      return fetchETHBalance(address, apiKey)  
    case 'ADA':
      return fetchADABalance(address)
    default:
      return {
        success: false,
        error: '不支援的鏈'
      }
  }
}

