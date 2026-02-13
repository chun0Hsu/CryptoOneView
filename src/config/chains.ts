export interface ChainConfig {
  id: string
  name: string
  symbol: string
  requiresApiKey: boolean
  apiKeyLabel?: string
  apiKeyUrl?: string
  inputHint?: string
}

export const CHAIN_REGISTRY: ChainConfig[] = [
  {
    id: 'BTC',
    name: 'Bitcoin',
    symbol: 'BTC',
    requiresApiKey: false,
    inputHint: '輸入 xpub / ypub / zpub 或單一地址',
  },
  {
    id: 'ETH',
    name: 'Ethereum',
    symbol: 'ETH',
    requiresApiKey: false,
    apiKeyLabel: 'Etherscan API Key',
    apiKeyUrl: 'https://etherscan.io/myapikey',
    inputHint: '輸入 ETH 地址 (0x...)',
  },
  {
    id: 'ADA',
    name: 'Cardano',
    symbol: 'ADA',
    requiresApiKey: false,
    inputHint: '輸入 stake address (stake1...) 或單一地址 (addr1...)',
  },
]

export function getChainConfig(id: string): ChainConfig | undefined {
  return CHAIN_REGISTRY.find(c => c.id === id)
}
