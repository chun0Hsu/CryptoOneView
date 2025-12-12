import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCredentialStore } from './useCredentialStore'
import { useWalletStore } from './useWalletStore'
import { fetchExchangeBalance } from '@/services/exchangeService'
import { fetchChainBalance } from '@/services/chainService'
import { fetchAllPrices } from '@/services/priceService'
import type { Asset, CryptoSymbol, PriceData, SourceType } from '@/types'

// 資產彙總資料
export interface AssetSummary {
  symbol: CryptoSymbol
  totalAmount: number
  priceUSD: number
  valueUSD: number
  percentage: number
  sources: Array<{
    source: SourceType
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

      // 記錄來源
      const existingSource = summary.sources.find(s => s.source === asset.source)
      if (existingSource) {
        existingSource.amount += asset.amount
      } else {
        summary.sources.push({
          source: asset.source,
          amount: asset.amount
        })
      }
    }

    // 計算 USD 價值
    let totalValueUSD = 0
    for (const summary of summaryMap.values()) {
      summary.valueUSD = summary.totalAmount * summary.priceUSD
      totalValueUSD += summary.valueUSD
    }

    // 計算百分比
    for (const summary of summaryMap.values()) {
      summary.percentage = totalValueUSD > 0 ? (summary.valueUSD / totalValueUSD) * 100 : 0
    }

    // 轉為陣列並排序（依價值降序）
    return Array.from(summaryMap.values()).sort((a, b) => b.valueUSD - a.valueUSD)
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

    try {
      // 1. 查詢價格
      const priceData = await fetchAllPrices()
      prices.value = priceData

      // 2. 查詢交易所餘額（使用 credentialStore）
      for (const cred of credentialStore.credentials) {
        try {
          const decrypted = credentialStore.getCredential(cred.exchange)
          if (!decrypted) continue

          const result = await fetchExchangeBalance(
            cred.exchange,
            decrypted.apiKey,
            decrypted.secret,
            decrypted.passphrase  // 傳遞 passphrase
          )

          if (result.success) {
            for (const balance of result.balances) {
              newAssets.push({
                symbol: balance.symbol,
                amount: balance.total,
                source: `${cred.exchange}_cex` as SourceType
              })
            }
          } else {
            errors.value.push(`${cred.exchange} 查詢失敗: ${result.error}`)
          }
        } catch (e: any) {
          errors.value.push(`${cred.exchange} 錯誤: ${e.message}`)
        }
      }

      // 3. 查詢鏈上錢包餘額
      for (const addr of walletStore.addresses) {
        try {
          const result = await fetchChainBalance(addr.chain, addr.address)

          if (result.success && result.data) {
            for (const balance of result.data.balances) {
              newAssets.push({
                symbol: balance.symbol,
                amount: balance.amount,
                source: addr.source as SourceType
              })
            }
          } else {
            errors.value.push(`${addr.source} ${addr.chain} 查詢失敗: ${result.error}`)
          }
        } catch (e: any) {
          errors.value.push(`${addr.source} ${addr.chain} 錯誤: ${e.message}`)
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
