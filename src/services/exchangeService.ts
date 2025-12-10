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
 * 查詢交易所餘額（Mock 版本，方便先開發 UI）
 * TODO: 之後實作真實的 Binance/OKX API 呼叫
 */
export async function fetchExchangeBalance(
  exchange: ExchangeName,
  apiKey: string,
  secret: string
): Promise<ExchangeBalanceResult> {

  // 模擬網路延遲
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Mock 資料
  const mockBalances: ExchangeBalance[] = [
    { symbol: 'BTC', free: 0.5, used: 0, total: 0.5 },
    { symbol: 'ETH', free: 100.3, used: 0, total: 100.3 },
    { symbol: 'USDT', free: 250000, used: 0, total: 250000 }
  ]

  return {
    success: true,
    balances: mockBalances
  }
}

/**
 * 驗證 API Key（Mock 版本）
 */
export async function validateAPIKey(
  exchange: ExchangeName,
  apiKey: string,
  secret: string
): Promise<{ valid: boolean; error?: string }> {

  await new Promise(resolve => setTimeout(resolve, 500))

  // 簡單驗證：只要有輸入就算有效
  if (apiKey && secret) {
    return { valid: true }
  }

  return { valid: false, error: 'API Key 或 Secret 為空' }
}
