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
    const url = `https://blockchain.info/q/addressbalance/${address}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const satoshis = await response.text()
    const btcAmount = parseInt(satoshis) / 100000000 // satoshi to BTC

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
async function fetchETHBalance(address: string): Promise<ChainBalanceResult> {
  try {
    // 驗證地址格式
    if (!address.startsWith('0x') || address.length !== 42) {
      throw new Error('無效的 ETH 地址格式')
    }

    // 使用 Etherscan 免費 API
    const url = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: 網路請求失敗`)
    }

    const data = await response.json()

    // 處理 Etherscan API 錯誤
    if (data.status === '0') {
      if (data.message === 'NOTOK') {
        throw new Error('Etherscan API rate limit 或查詢失敗，請稍後再試')
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
 * 使用 Blockfrost API（需要免費 API Key）
 */
async function fetchADABalance(address: string): Promise<ChainBalanceResult> {
  try {
    // 暫時返回 Mock 資料，因為 Blockfrost 需要 API Key
    // TODO: 實作 Blockfrost API 呼叫

    return {
      success: false,
      error: 'ADA 查詢尚未實作（需要 Blockfrost API Key）'
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
  address: string
): Promise<ChainBalanceResult> {
  switch (chain) {
    case 'BTC':
      return fetchBTCBalance(address)
    case 'ETH':
      return fetchETHBalance(address)
    case 'ADA':
      return fetchADABalance(address)
    default:
      return {
        success: false,
        error: '不支援的鏈'
      }
  }
}
