import type { CryptoSymbol, PriceData } from '@/types'

// 🔥 常量：塵埃過濾閾值
export const DUST_THRESHOLD_USD = 1.0  // 低於 1 USD 的資產視為塵埃

// 價格快取 (避免重複查詢)
const priceCache = new Map<string, { price: number; timestamp: number }>()
const CACHE_TTL = 60 * 1000  // 1 分鐘快取

/**
 * 使用 Binance Ticker API 批量查詢價格
 * 優點：免費、快速、無需 API Key
 * 支援幾乎所有幣種 (相較於 CoinGecko 需要 coin ID mapping)
 */
export async function fetchPricesFromBinance(symbols: CryptoSymbol[]): Promise<Map<CryptoSymbol, PriceData>> {
  const priceMap = new Map<CryptoSymbol, PriceData>()

  try {
    // 呼叫 Binance 24hr Ticker API (獲取所有交易對)
    const response = await fetch('https://api.binance.com/api/v3/ticker/price')

    if (!response.ok) {
      throw new Error(`Binance Ticker API error: ${response.status}`)
    }

    const allPrices = await response.json()
    const timestamp = Date.now()

    // 建立 symbol -> price 的映射
    const tickerMap = new Map<string, number>()
    for (const ticker of allPrices) {
      // ticker.symbol 格式: "BTCUSDT", "ETHUSDT"
      // ticker.price: "95123.45"
      tickerMap.set(ticker.symbol, parseFloat(ticker.price))
    }

    // 查詢每個幣種的 USDT 價格
    for (const symbol of symbols) {
      // 檢查快取
      const cached = priceCache.get(symbol)
      if (cached && (timestamp - cached.timestamp) < CACHE_TTL) {
        priceMap.set(symbol, {
          symbol,
          priceUSD: cached.price,
          timestamp: cached.timestamp
        })
        continue
      }

      // 特殊處理穩定幣
      if (['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'FDUSD'].includes(symbol)) {
        const priceData = { symbol, priceUSD: 1.0, timestamp }
        priceMap.set(symbol, priceData)
        priceCache.set(symbol, { price: 1.0, timestamp })
        continue
      }

      // 嘗試不同的交易對
      const pairs = [
        `${symbol}USDT`,  // 主要交易對
        `${symbol}BUSD`,
        `${symbol}USDC`
      ]

      let found = false
      for (const pair of pairs) {
        const price = tickerMap.get(pair)
        if (price && price > 0) {
          const priceData = { symbol, priceUSD: price, timestamp }
          priceMap.set(symbol, priceData)
          priceCache.set(symbol, { price, timestamp })
          found = true
          break
        }
      }

      if (!found) {
        console.warn(`Price not found for ${symbol}`)
      }
    }

    return priceMap

  } catch (error) {
    console.error('Failed to fetch prices from Binance:', error)
    return priceMap
  }
}

/**
 * CoinGecko 備用方案（如果 Binance 失敗）
 * 缺點：需要 coin ID mapping、免費版有 rate limit
 */
export async function fetchPricesFromCoinGecko(symbols: CryptoSymbol[]): Promise<Map<CryptoSymbol, PriceData>> {
  const priceMap = new Map<CryptoSymbol, PriceData>()

  // CoinGecko coin ID 映射 (常見幣種)
  const coinIdMap: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'ADA': 'cardano',
    'SOL': 'solana',
    'XRP': 'ripple',
    'DOT': 'polkadot',
    'DOGE': 'dogecoin',
    'MATIC': 'matic-network',
    'LINK': 'chainlink',
    // ... 可擴充更多
  }

  try {
    const coinIds = symbols
      .map(s => coinIdMap[s])
      .filter(id => id !== undefined)
      .join(',')

    if (!coinIds) {
      return priceMap
    }

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()
    const timestamp = Date.now()

    for (const symbol of symbols) {
      const coinId = coinIdMap[symbol]
      if (coinId && data[coinId]?.usd) {
        priceMap.set(symbol, {
          symbol,
          priceUSD: data[coinId].usd,
          timestamp
        })
      }
    }

    return priceMap

  } catch (error) {
    console.error('Failed to fetch prices from CoinGecko:', error)
    return priceMap
  }
}

/**
 * 主要價格查詢函數（優先使用 Binance，失敗則用 CoinGecko）
 */
export async function fetchPrices(symbols: CryptoSymbol[]): Promise<Map<CryptoSymbol, PriceData>> {
  if (symbols.length === 0) {
    return new Map()
  }

  // 優先使用 Binance Ticker API
  let priceMap = await fetchPricesFromBinance(symbols)

  // 如果 Binance 完全失敗，嘗試 CoinGecko
  if (priceMap.size === 0) {
    console.warn('Binance prices failed, trying CoinGecko...')
    priceMap = await fetchPricesFromCoinGecko(symbols)
  }

  return priceMap
}

/**
 * 清除價格快取
 */
export function clearPriceCache() {
  priceCache.clear()
}
