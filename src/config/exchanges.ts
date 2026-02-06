export type AccountType =
  | 'spot'
  | 'funding'
  | 'earn_flexible'
  | 'earn_locked'
  | 'futures_usdt'
  | 'futures_coin'
  | 'margin'
  | 'savings'
  | 'staking'

export interface AccountTypeConfig {
  id: AccountType
  label: string
  apiAction: string
}

export interface ExchangeConfig {
  id: string
  name: string
  sourceType: string
  color: string
  requiresPassphrase: boolean
  accountTypes: AccountTypeConfig[]
}

export const EXCHANGE_REGISTRY: ExchangeConfig[] = [
  {
    id: 'binance',
    name: 'Binance',
    sourceType: 'binance_cex',
    color: 'amber',
    requiresPassphrase: false,
    accountTypes: [
      { id: 'spot', label: 'Spot', apiAction: 'spot' },
      { id: 'earn_flexible', label: 'Earn (Flexible)', apiAction: 'earn_flexible' },
      { id: 'earn_locked', label: 'Earn (Locked)', apiAction: 'earn_locked' },
      { id: 'funding', label: 'Funding', apiAction: 'funding' },
      { id: 'futures_usdt', label: 'USDT-M Futures', apiAction: 'futures_usdt' },
      { id: 'futures_coin', label: 'COIN-M Futures', apiAction: 'futures_coin' },
    ],
  },
  {
    id: 'okx',
    name: 'OKX',
    sourceType: 'okx_cex',
    color: 'blue',
    requiresPassphrase: true,
    accountTypes: [
      { id: 'spot', label: 'Trading', apiAction: 'trading' },
      { id: 'savings', label: 'Savings', apiAction: 'savings' },
      { id: 'funding', label: 'Funding', apiAction: 'funding' },
      { id: 'staking', label: 'Staking', apiAction: 'staking' },
    ],
  },
]

export function getExchangeConfig(id: string): ExchangeConfig | undefined {
  return EXCHANGE_REGISTRY.find(e => e.id === id)
}
