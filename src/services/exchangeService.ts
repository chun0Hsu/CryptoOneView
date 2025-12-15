import type { ExchangeName, CryptoSymbol } from '@/types'

// 單一幣種餘額
export interface ExchangeBalance {
  symbol: CryptoSymbol
  free: number
  used: number
  total: number
}

// 查詢結果
export interface ExchangeBalanceResult {
  success: boolean
  balances: ExchangeBalance[]
  error?: string
}

/**
 * 取得 API 端點 URL
 */
function getFunctionUrl(functionName: string): string {
  // Vercel 部署：使用 /api/ 路徑
  // 本地開發：Vercel CLI 會自動處理
  return `/api/${functionName}`
}

/**
 * 查詢 Binance 餘額
 */
async function fetchBinanceBalance(
  apiKey: string,
  secret: string
): Promise<ExchangeBalanceResult> {
  try {
    const url = getFunctionUrl('binance-balance')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ apiKey, secret })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const data = await response.json()

    return {
      success: true,
      balances: data.balances
    }
  } catch (error: any) {
    console.error('Binance API error:', error)
    return {
      success: false,
      balances: [],
      error: error.message || 'Binance 查詢失敗'
    }
  }
}

/**
 * 查詢 OKX 餘額
 */
async function fetchOKXBalance(
  apiKey: string,
  secret: string,
  passphrase?: string
): Promise<ExchangeBalanceResult> {
  try {
    if (!passphrase) {
      throw new Error('OKX API 需要 Passphrase')
    }

    const url = getFunctionUrl('okx-balance')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ apiKey, secret, passphrase })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const data = await response.json()

    return {
      success: true,
      balances: data.balances
    }
  } catch (error: any) {
    console.error('OKX API error:', error)
    return {
      success: false,
      balances: [],
      error: error.message || 'OKX 查詢失敗'
    }
  }
}

/**
 * 查詢交易所餘額（統一介面）
 */
export async function fetchExchangeBalance(
  exchange: ExchangeName,
  apiKey: string,
  secret: string,
  passphrase?: string
): Promise<ExchangeBalanceResult> {
  switch (exchange) {
    case 'binance':
      return fetchBinanceBalance(apiKey, secret)
    case 'okx':
      return fetchOKXBalance(apiKey, secret, passphrase)
    default:
      return {
        success: false,
        balances: [],
        error: '不支援的交易所'
      }
  }
}

/**
 * 驗證 API Key（簡單驗證：嘗試查詢餘額）
 */
export async function validateAPIKey(
  exchange: ExchangeName,
  apiKey: string,
  secret: string,
  passphrase?: string
): Promise<{ valid: boolean; error?: string }> {
  const result = await fetchExchangeBalance(exchange, apiKey, secret, passphrase)

  if (result.success) {
    return { valid: true }
  }

  return { valid: false, error: result.error }
}

/**
 * Earn 餘額結果
 */
export interface EarnBalanceResult {
  success: boolean
  balances: Array<{
    symbol: CryptoSymbol
    amount: number
    type: string
  }>
  error?: string
}

/**
 * 查詢 Binance Earn 餘額
 */
async function fetchBinanceEarn(
  apiKey: string,
  secret: string
): Promise<EarnBalanceResult> {
  try {
    const url = getFunctionUrl('binance-earn')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ apiKey, secret })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const data = await response.json()

    return {
      success: true,
      balances: data.balances
    }
  } catch (error: any) {
    return {
      success: false,
      balances: [],
      error: error.message
    }
  }
}

/**
 * 查詢 OKX Earn 餘額
 */
async function fetchOKXEarn(
  apiKey: string,
  secret: string,
  passphrase: string
): Promise<EarnBalanceResult> {
  try {
    const url = getFunctionUrl('okx-earn')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ apiKey, secret, passphrase })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const data = await response.json()

    return {
      success: true,
      balances: data.balances
    }
  } catch (error: any) {
    return {
      success: false,
      balances: [],
      error: error.message
    }
  }
}

/**
 * 查詢交易所 Earn 餘額（統一介面）
 */
export async function fetchExchangeEarn(
  exchange: ExchangeName,
  apiKey: string,
  secret: string,
  passphrase?: string
): Promise<EarnBalanceResult> {
  switch (exchange) {
    case 'binance':
      return fetchBinanceEarn(apiKey, secret)
    case 'okx':
      if (!passphrase) {
        return { success: false, balances: [], error: 'Missing passphrase' }
      }
      return fetchOKXEarn(apiKey, secret, passphrase)
    default:
      return {
        success: false,
        balances: [],
        error: '不支援的交易所'
      }
  }
}

