export interface SourceConfig {
  id: string
  label: string
  type: 'cex' | 'hot_wallet' | 'cold_wallet'
  color: string
  activeClasses: string
  activeTextClass: string
  activeGlowClass: string
}

export const SOURCE_REGISTRY: SourceConfig[] = [
  {
    id: 'binance_cex',
    label: 'Binance CEX',
    type: 'cex',
    color: 'amber',
    activeClasses: 'bg-slate-700 border-amber-500/50 text-amber-100 shadow-lg shadow-amber-500/20',
    activeTextClass: 'text-amber-400',
    activeGlowClass: 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent',
  },
  {
    id: 'okx_cex',
    label: 'OKX CEX',
    type: 'cex',
    color: 'blue',
    activeClasses: 'bg-slate-700 border-blue-500/50 text-blue-100 shadow-lg shadow-blue-500/20',
    activeTextClass: 'text-blue-400',
    activeGlowClass: 'bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent',
  },
  {
    id: 'binance_hot',
    label: 'Binance Hot',
    type: 'hot_wallet',
    color: 'orange',
    activeClasses: 'bg-slate-700 border-orange-500/50 text-orange-100 shadow-lg shadow-orange-500/20',
    activeTextClass: 'text-orange-400',
    activeGlowClass: 'bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent',
  },
  {
    id: 'okx_hot',
    label: 'OKX Hot',
    type: 'hot_wallet',
    color: 'teal',
    activeClasses: 'bg-slate-700 border-teal-500/50 text-teal-100 shadow-lg shadow-teal-500/20',
    activeTextClass: 'text-teal-400',
    activeGlowClass: 'bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent',
  },
  {
    id: 'ledger_cold',
    label: 'Ledger Cold',
    type: 'cold_wallet',
    color: 'violet',
    activeClasses: 'bg-slate-700 border-violet-500/50 text-violet-100 shadow-lg shadow-violet-500/20',
    activeTextClass: 'text-violet-400',
    activeGlowClass: 'bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-transparent',
  },
]

export function getSourceConfig(id: string): SourceConfig | undefined {
  return SOURCE_REGISTRY.find(s => s.id === id)
}

export function getWalletSources(): SourceConfig[] {
  return SOURCE_REGISTRY.filter(s => s.type === 'hot_wallet' || s.type === 'cold_wallet')
}
