import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCredentialStore } from './useCredentialStore'
import { useWalletStore } from './useWalletStore'
import { fetchExchangeBalance, fetchExchangeEarn } from '@/services/exchangeService'
import { fetchChainBalance } from '@/services/chainService'
import { fetchPrices, DUST_THRESHOLD_USD } from '@/services/priceService'
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
    const summaries: AssetSummary[] = []

    for (const summary of summaryMap.values()) {
      summary.valueUSD = summary.totalAmount * summary.priceUSD

      // 🔥 過濾塵埃資產：總價值低於 1 USD 的不顯示
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

  // 🔥 重新整理所有資料（重構版）
  async function refresh() {
    isLoading.value = true
    errors.value = []
    const newAssets: Asset[] = []
    const allSymbols = new Set<CryptoSymbol>()

    try {
      // ==========================================
      // 1️⃣ 查詢交易所餘額（現貨 + Earn）
      // ==========================================
      for (const cred of credentialStore.credentials) {
        try {
          const decrypted = credentialStore.getCredential(cred.exchange)
          if (!decrypted) continue

          // 1.1 查詢現貨帳戶
          const spotResult = await fetchExchangeBalance(
            cred.exchange,
            decrypted.apiKey,
            decrypted.secret,
            decrypted.passphrase
          )

          if (spotResult.success) {
            for (const balance of spotResult.balances) {
              newAssets.push({
                symbol: balance.symbol,
                amount: balance.total,
                source: `${cred.exchange}_cex` as SourceType
              })
              allSymbols.add(balance.symbol)
            }
          } else {
            errors.value.push(`${cred.exchange} 現貨查詢失敗: ${spotResult.error}`)
          }

          // 1.2 查詢 Earn 帳戶
          try {
            const earnResult = await fetchExchangeEarn(
              cred.exchange,
              decrypted.apiKey,
              decrypted.secret,
              decrypted.passphrase
            )

            if (earnResult.success) {
              for (const balance of earnResult.balances) {
                newAssets.push({
                  symbol: balance.symbol,
                  amount: balance.amount,
                  source: `${cred.exchange}_cex` as SourceType
                })
                allSymbols.add(balance.symbol)
              }
            }
          } catch (e) {
            console.log(`${cred.exchange} Earn 查詢略過`)
          }

        } catch (e: any) {
          errors.value.push(`${cred.exchange} 錯誤: ${e.message}`)
        }
      }

      // ==========================================
      // 2️⃣ 查詢鏈上錢包餘額
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
                source: addr.source as SourceType
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
      // 3️⃣ 動態查詢價格
      // ==========================================
      if (allSymbols.size > 0) {
        const symbolList = Array.from(allSymbols)
        const priceData = await fetchPrices(symbolList)
        prices.value = priceData

        // 記錄找不到價格的幣種
        for (const symbol of symbolList) {
          if (!priceData.has(symbol)) {
            console.warn(`⚠️ 找不到 ${symbol} 的價格，該幣種將不計入總資產`)
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
