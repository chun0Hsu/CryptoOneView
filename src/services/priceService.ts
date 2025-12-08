import type { CryptoSymbol, PriceData } from '@/types'

// CoinGecko 的 coin ID 對應
const COIN_IDS: Record<CryptoSymbol, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  ADA: 'cardano',
  USDT: 'tether',
  USDC: 'usd-coin'
}

/**
 * 查詢單一幣種價格
 */
export async function fetchPrice(symbol: CryptoSymbol): Promise<PriceData | null> {
  try {
    const coinId = COIN_IDS[symbol]
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const priceUSD = data[coinId]?.usd

    if (!priceUSD) {
      return null
    }

    return {
      symbol,
      priceUSD,
      timestamp: Date.now()
    }
  } catch (error) {
    console.error(`Failed to fetch price for ${symbol}:`, error)
    return null
  }
}

/**
 * 批量查詢多個幣種價格
 */
export async function fetchPrices(symbols: CryptoSymbol[]): Promise<Map<CryptoSymbol, PriceData>> {
  const priceMap = new Map<CryptoSymbol, PriceData>()

  try {
    // 建立 coin IDs 查詢字串
    const coinIds = symbols.map(s => COIN_IDS[s]).join(',')
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // 轉換為 Map
    for (const symbol of symbols) {
      const coinId = COIN_IDS[symbol]
      const priceUSD = data[coinId]?.usd

      if (priceUSD) {
        priceMap.set(symbol, {
          symbol,
          priceUSD,
          timestamp: Date.now()
        })
      }
    }

    return priceMap
  } catch (error) {
    console.error('Failed to fetch prices:', error)
    return priceMap
  }
}

/**
 * 查詢所有支援幣種的價格
 */
export async function fetchAllPrices(): Promise<Map<CryptoSymbol, PriceData>> {
  const allSymbols: CryptoSymbol[] = ['BTC', 'ETH', 'ADA', 'USDT', 'USDC']
  return fetchPrices(allSymbols)
}
