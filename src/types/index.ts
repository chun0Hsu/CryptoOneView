// 資料來源類型
export type SourceType = 'exchange' | 'ledger'

// 交易所名稱（MVP 只支援 Binance 和 OKX）
export type ExchangeName = 'binance' | 'okx'

// 支援的幣種
export type CryptoSymbol = 'BTC' | 'ETH' | 'ADA' | 'USDT' | 'USDC'

// 單一資產資料結構
export interface Asset {
  symbol: CryptoSymbol
  amount: number
  source: SourceType
  sourceName: string      // 例如：'Binance CEX', 'OKX CEX', 'Ledger Cold'
  chain?: string          // 僅用於 USDT/USDC (ERC-20, TRC-20, Polygon...)
}

// 加密的交易所 API 金鑰
export interface EncryptedCredential {
  id: string
  exchange: ExchangeName
  encryptedApiKey: string     // AES-256 加密的 API Key
  encryptedSecret: string     // AES-256 加密的 Secret
  createdAt: number
}

// Ledger 冷錢包地址
export interface LedgerAddress {
  id: string
  chain: 'BTC' | 'ETH' | 'ADA'
  address: string
  label?: string
  createdAt: number
}

// 價格資料
export interface PriceData {
  symbol: CryptoSymbol
  priceUSD: number
  timestamp: number
}
