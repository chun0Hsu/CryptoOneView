// 資料來源類型（5個來源）
export type SourceType =
  | 'binance_cex'    // Binance 交易所
  | 'okx_cex'        // OKX 交易所
  | 'binance_hot'    // Binance 熱錢包
  | 'okx_hot'        // OKX 熱錢包
  | 'ledger_cold'    // Ledger 冷錢包

// 交易所名稱（僅用於 CEX API）
export type ExchangeName = 'binance' | 'okx'

// 🔥 改為動態：移除固定的 CryptoSymbol type
// export type CryptoSymbol = 'BTC' | 'ETH' | 'ADA' | 'USDT' | 'USDC'
export type CryptoSymbol = string  // ← 改為動態支援所有幣種

// 單一資產資料結構
export interface Asset {
  symbol: CryptoSymbol
  amount: number
  source: SourceType
  chain?: string          // 僅用於 USDT/USDC (ERC-20, TRC-20, Polygon...)
}

// 加密的交易所 API 金鑰（僅用於 CEX）
export interface EncryptedCredential {
  id: string
  exchange: ExchangeName
  encryptedApiKey: string     // AES-256 加密的 API Key
  encryptedSecret: string     // AES-256 加密的 Secret
  createdAt: number
}

// 價格資料
export interface PriceData {
  symbol: CryptoSymbol
  priceUSD: number
  timestamp: number
}

// 🆕 幣種資訊（含圖示）
export interface CoinInfo {
  symbol: CryptoSymbol
  name?: string
  imageUrl?: string
  isSupported: boolean  // 是否有價格資料
}
