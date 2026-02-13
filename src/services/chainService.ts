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

/**
 * 透過 Vercel serverless proxy 查詢鏈上餘額
 * 避免 CORS 和 Cloudflare 問題
 */
export async function fetchChainBalance(
  chain: string,
  address: string,
  apiKey?: string
): Promise<ChainBalanceResult> {
  const supportedChains = ['BTC', 'ETH', 'ADA']
  if (!supportedChains.includes(chain)) {
    return { success: false, error: '不支援的鏈' }
  }

  try {
    const response = await fetch('/api/chain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chain, address, apiKey }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    if (!data.success) {
      return { success: false, error: data.error || `${chain} 查詢失敗` }
    }

    if (!data.symbol || typeof data.amount !== 'number') {
      return { success: false, error: `${chain} API 回傳格式錯誤` }
    }

    return {
      success: true,
      data: {
        chain,
        address,
        balances: [{ symbol: data.symbol, amount: data.amount }],
      },
    }
  } catch (error: any) {
    console.error(`Failed to fetch ${chain} balance:`, error)
    return { success: false, error: error.message || `${chain} 查詢失敗` }
  }
}
