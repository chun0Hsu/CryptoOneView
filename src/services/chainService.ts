import type { CryptoSymbol } from '@/types'

export interface ChainBalance {
  chain: string
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

interface ChainAdapter {
  fetch(address: string, apiKey?: string): Promise<ChainBalanceResult>
}

// BTC adapter
const btcAdapter: ChainAdapter = {
  async fetch(address: string): Promise<ChainBalanceResult> {
    try {
      const url = `https://blockchain.info/balance?active=${address}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const addressData = data[address]

      if (!addressData) {
        throw new Error('地址查詢失敗')
      }

      const satoshis = addressData.final_balance
      const btcAmount = satoshis / 100000000

      return {
        success: true,
        data: {
          chain: 'BTC',
          address,
          balances: [{ symbol: 'BTC', amount: btcAmount }],
        },
      }
    } catch (error: any) {
      console.error('Failed to fetch BTC balance:', error)
      return { success: false, error: error.message || 'BTC 查詢失敗' }
    }
  },
}

// ETH adapter
const ethAdapter: ChainAdapter = {
  async fetch(address: string, apiKey?: string): Promise<ChainBalanceResult> {
    try {
      if (!address.startsWith('0x') || address.length !== 42) {
        throw new Error('無效的 ETH 地址格式')
      }

      const params = new URLSearchParams({
        chainid: '1',
        module: 'account',
        action: 'balance',
        address: address,
        tag: 'latest',
      })

      if (apiKey) {
        params.append('apikey', apiKey)
      }

      const url = `https://api.etherscan.io/v2/api?${params.toString()}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 網路請求失敗`)
      }

      const data = await response.json()

      if (data.status === '0' || data.status !== '1') {
        if (
          data.message === 'NOTOK' ||
          data.result?.includes('rate limit') ||
          data.result?.includes('Max rate limit reached')
        ) {
          const errorMsg = apiKey
            ? 'Etherscan API 請求過於頻繁，請稍後再試'
            : 'Etherscan API 請求受限，建議在設定中加入 API Key'
          console.warn(errorMsg)
          return { success: false, error: errorMsg }
        }
        throw new Error(data.result || data.message || '查詢失敗')
      }

      const weiAmount = data.result
      const ethAmount = parseFloat(weiAmount) / 1e18

      return {
        success: true,
        data: {
          chain: 'ETH',
          address,
          balances: [{ symbol: 'ETH', amount: ethAmount }],
        },
      }
    } catch (error: any) {
      console.error('Failed to fetch ETH balance:', error)
      return { success: false, error: error.message || 'ETH 查詢失敗' }
    }
  },
}

// ADA adapter
const adaAdapter: ChainAdapter = {
  async fetch(address: string): Promise<ChainBalanceResult> {
    try {
      const url = `https://api.koios.rest/api/v1/address_info?_address=${address}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data || data.length === 0) {
        throw new Error('地址查詢失敗')
      }

      const addressInfo = data[0]
      const lovelace = parseInt(addressInfo.balance || '0')
      const adaAmount = lovelace / 1000000

      return {
        success: true,
        data: {
          chain: 'ADA',
          address,
          balances: [{ symbol: 'ADA', amount: adaAmount }],
        },
      }
    } catch (error: any) {
      console.error('Failed to fetch ADA balance:', error)
      return { success: false, error: error.message || 'ADA 查詢失敗' }
    }
  },
}

// Adapter map
const chainAdapters: Record<string, ChainAdapter> = {
  BTC: btcAdapter,
  ETH: ethAdapter,
  ADA: adaAdapter,
}

/**
 * 統一的鏈上查詢介面
 */
export async function fetchChainBalance(
  chain: string,
  address: string,
  apiKey?: string
): Promise<ChainBalanceResult> {
  const adapter = chainAdapters[chain]
  if (!adapter) {
    return { success: false, error: '不支援的鏈' }
  }
  return adapter.fetch(address, apiKey)
}
