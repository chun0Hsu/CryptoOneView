import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCredentialStore } from './useCredentialStore'
import { useWalletStore } from './useWalletStore'
import { fetchAllExchangeBalances } from '@/services/exchangeService'
import { fetchChainBalance } from '@/services/chainService'
import { fetchPrices, DUST_THRESHOLD_USD } from '@/services/priceService'
import type { Asset, CryptoSymbol, PriceData, SourceType } from '@/types'
import { getExchangeConfig } from '@/config/exchanges'

// 資產彙總資料
export interface AssetSummary {
  symbol: CryptoSymbol
  totalAmount: number
  priceUSD: number
  valueUSD: number
  percentage: number
  sources: Array<{
    source: SourceType
    accountType?: string
    amount: number
  }>
}

export const useAssetStore = defineStore('asset', () => {
  const credentialStore = useCredentialStore()
  const walletStore = useWalletStore()

  // 狀態
  const assets = ref<Asset[]>([])
  const prices = ref<Map<CryptoSymbol, PriceData>>(new Map())
  const isLoading = ref(false)
  const lastUpdated = ref<number | null>(null)
  const errors = ref<string[]>([])

  // Getter: 計算資產彙總
  const assetSummaries = computed<AssetSummary[]>(() => {
    // 依幣種分組彙總
    const summaryMap = new Map<CryptoSymbol, AssetSummary>()

    for (const asset of assets.value) {
      let summary = summaryMap.get(asset.symbol)

      if (!summary) {
        const price = prices.value.get(asset.symbol)
        summary = {
          symbol: asset.symbol,
          totalAmount: 0,
          priceUSD: price?.priceUSD || 0,
          valueUSD: 0,
          percentage: 0,
          sources: []
        }
        summaryMap.set(asset.symbol, summary)
      }

      summary.totalAmount += asset.amount

      // 記錄來源（含 accountType）
      const existingSource = summary.sources.find(
        s => s.source === asset.source && s.accountType === asset.accountType
      )
      if (existingSource) {
        existingSource.amount += asset.amount
      } else {
        summary.sources.push({
          source: asset.source,
          accountType: asset.accountType,
          amount: asset.amount
        })
      }
    }

    // 計算 USD 價值
    let totalValueUSD = 0
    const summaries: AssetSummary[] = []

    for (const summary of summaryMap.values()) {
      summary.valueUSD = summary.totalAmount * summary.priceUSD

      // 過濾塵埃資產：總價值低於 1 USD 的不顯示
      if (summary.valueUSD >= DUST_THRESHOLD_USD || summary.priceUSD === 0) {
        summaries.push(summary)
        totalValueUSD += summary.valueUSD
      }
    }

    // 計算百分比
    for (const summary of summaries) {
      summary.percentage = totalValueUSD > 0 ? (summary.valueUSD / totalValueUSD) * 100 : 0
    }

    // 排序（依價值降序）
    return summaries.sort((a, b) => b.valueUSD - a.valueUSD)
  })

  // Getter: 總資產價值 USD
  const totalValueUSD = computed(() => {
    return assetSummaries.value.reduce((sum, s) => sum + s.valueUSD, 0)
  })

  // 重新整理所有資料
  async function refresh() {
    isLoading.value = true
    errors.value = []
    const newAssets: Asset[] = []
    const allSymbols = new Set<CryptoSymbol>()

    try {
      // ==========================================
      // 1. 查詢交易所餘額（所有子帳戶並行）
      // ==========================================
      for (const cred of credentialStore.credentials) {
        try {
          const decrypted = credentialStore.getCredential(cred.exchange)
          if (!decrypted) continue

          const config = getExchangeConfig(cred.exchange)
          const sourceType = config?.sourceType || `${cred.exchange}_cex`

          const result = await fetchAllExchangeBalances(
            cred.exchange,
            decrypted.apiKey,
            decrypted.secret,
            decrypted.passphrase
          )

          for (const balance of result.balances) {
            newAssets.push({
              symbol: balance.symbol,
              amount: balance.amount,
              source: sourceType,
              accountType: balance.accountType,
            })
            allSymbols.add(balance.symbol)
          }

          // 收集非致命錯誤
          errors.value.push(...result.errors)

        } catch (e: any) {
          errors.value.push(`${cred.exchange} 錯誤: ${e.message}`)
        }
      }

      // ==========================================
      // 2. 查詢鏈上錢包餘額
      // ==========================================
      for (const addr of walletStore.addresses) {
        try {
          const apiKey = addr.encryptedApiKey ? walletStore.getApiKey(addr.id) : undefined
          const result = await fetchChainBalance(addr.chain, addr.address, apiKey || undefined)

          if (result.success && result.data) {
            for (const balance of result.data.balances) {
              newAssets.push({
                symbol: balance.symbol,
                amount: balance.amount,
                source: addr.source,
              })
              allSymbols.add(balance.symbol)
            }
          } else if (result.error) {
            if (result.error.includes('rate limit') && !addr.encryptedApiKey) {
              errors.value.push(`${addr.source} ${addr.chain}: 查詢受限，建議加入 API Key`)
            } else if (!result.error.includes('頻繁') && !result.error.includes('請稍後')) {
              errors.value.push(`${addr.source} ${addr.chain}: ${result.error}`)
            }
          }

        } catch (e: any) {
          errors.value.push(`${addr.source} ${addr.chain} 錯誤: ${e.message}`)
        }
      }

      // ==========================================
      // 3. 動態查詢價格
      // ==========================================
      if (allSymbols.size > 0) {
        const symbolList = Array.from(allSymbols)
        const priceData = await fetchPrices(symbolList)
        prices.value = priceData

        // 記錄找不到價格的幣種
        for (const symbol of symbolList) {
          if (!priceData.has(symbol)) {
            console.warn(`找不到 ${symbol} 的價格，該幣種將不計入總資產`)
          }
        }
      }

      // 更新狀態
      assets.value = newAssets
      lastUpdated.value = Date.now()

    } catch (e: any) {
      errors.value.push(`整體查詢錯誤: ${e.message}`)
    } finally {
      isLoading.value = false
    }
  }

  // 清空資料
  function clear() {
    assets.value = []
    prices.value = new Map()
    lastUpdated.value = null
    errors.value = []
  }

  return {
    assets,
    prices,
    isLoading,
    lastUpdated,
    errors,
    assetSummaries,
    totalValueUSD,
    refresh,
    clear
  }
})
