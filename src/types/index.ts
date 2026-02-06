// 資料來源類型（registry 驅動）
export type SourceType = string

// 交易所名稱（registry 驅動）
export type ExchangeName = string

// 動態支援所有幣種
export type CryptoSymbol = string

// 單一資產資料結構
export interface Asset {
  symbol: CryptoSymbol
  amount: number
  source: SourceType
  accountType?: string    // 'spot', 'funding', 'earn_flexible', etc.
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

// 幣種資訊（含圖示）
export interface CoinInfo {
  symbol: CryptoSymbol
  name?: string
  imageUrl?: string
  isSupported: boolean  // 是否有價格資料
}
