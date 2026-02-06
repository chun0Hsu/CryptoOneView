export interface ChainConfig {
  id: string
  name: string
  symbol: string
  requiresApiKey: boolean
  apiKeyLabel?: string
  apiKeyUrl?: string
}

export const CHAIN_REGISTRY: ChainConfig[] = [
  {
    id: 'BTC',
    name: 'Bitcoin',
    symbol: 'BTC',
    requiresApiKey: false,
  },
  {
    id: 'ETH',
    name: 'Ethereum',
    symbol: 'ETH',
    requiresApiKey: false,
    apiKeyLabel: 'Etherscan API Key',
    apiKeyUrl: 'https://etherscan.io/myapikey',
  },
  {
    id: 'ADA',
    name: 'Cardano',
    symbol: 'ADA',
    requiresApiKey: false,
  },
]

export function getChainConfig(id: string): ChainConfig | undefined {
  return CHAIN_REGISTRY.find(c => c.id === id)
}
