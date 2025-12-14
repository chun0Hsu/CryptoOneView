<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAssetStore } from '@/stores/useAssetStore'
import { useAuthStore } from '@/stores/useAuthStore'
import type { SourceType } from '@/types'
import SettingsModal from './SettingsModal.vue'
import AssetChart from './AssetChart.vue'
import CoinIcon from './CoinIcon.vue'
import Toast from './Toast.vue'
import { useToastStore } from '@/stores/useToastStore'

const assetStore = useAssetStore()
const authStore = useAuthStore()
const toastStore = useToastStore()

// 來源過濾器（預設全選）
const sourceFilters = ref({
  binance_cex: true,
  okx_cex: true,
  binance_hot: true,
  okx_hot: true,
  ledger_cold: true
})

// 根據 Filter 過濾資產
const filteredAssets = computed(() => {
  // 取得所有啟用的來源
  const enabledSources = Object.entries(sourceFilters.value)
    .filter(([_, enabled]) => enabled)
    .map(([source, _]) => source as SourceType)

  // 如果全部都沒勾選，就顯示全部
  if (enabledSources.length === 0) {
    return assetStore.assetSummaries
  }

  // 過濾資產：只保留來源符合的
  return assetStore.assetSummaries.map(summary => {
    // 過濾該幣種的來源
    const filteredSources = summary.sources.filter(s =>
      enabledSources.includes(s.source)
    )

    // 重新計算數量
    const totalAmount = filteredSources.reduce((sum, s) => sum + s.amount, 0)

    // 如果過濾後數量為 0，就不顯示這個幣種
    if (totalAmount === 0) return null

    return {
      ...summary,
      totalAmount,
      valueUSD: totalAmount * summary.priceUSD,
      sources: filteredSources
    }
  }).filter(s => s !== null) as any[]
})

// 過濾後的總價值
const filteredTotalValue = computed(() => {
  return filteredAssets.value.reduce((sum, s) => sum + s.valueUSD, 0)
})

// 重新計算百分比
const filteredAssetsWithPercentage = computed(() => {
  const total = filteredTotalValue.value
  return filteredAssets.value.map(asset => ({
    ...asset,
    percentage: total > 0 ? (asset.valueUSD / total) * 100 : 0
  }))
})

// Modal 控制
const showSettings = ref(false)

// 重新整理資產
async function handleRefresh() {
  await assetStore.refresh()

  if (assetStore.errors.length > 0) {
    toastStore.warning(`查詢完成，但有 ${assetStore.errors.length} 個錯誤`)
  } else {
    toastStore.success('資產更新成功！')
  }
}

// 登出
function handleLogout() {
  authStore.lock()
}

// 監聽使用者活動，重置 session 超時
function handleUserActivity() {
  authStore.recordActivity()
}

// 監聽的事件類型
const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart']

onMounted(() => {
  // 註冊所有活動事件監聽器
  activityEvents.forEach(event => {
    window.addEventListener(event, handleUserActivity)
  })
})

onUnmounted(() => {
  // 清除所有事件監聽器
  activityEvents.forEach(event => {
    window.removeEventListener(event, handleUserActivity)
  })
})
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white">

    <!-- Header -->
    <header class="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-3">
            <div
              class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-xl">
              C
            </div>
            <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              CryptoOneView
            </h1>
          </div>

          <div class="flex items-center space-x-4">
            <button @click="handleRefresh" :disabled="assetStore.isLoading"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg font-semibold transition flex items-center space-x-2">
              <span>{{ assetStore.isLoading ? '⟳ 更新中...' : '🔄 Refresh' }}</span>
            </button>

            <button @click="showSettings = true"
              class="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition">
              ⚙️ Settings
            </button>

            <button @click="handleLogout"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition">
              🔒 Lock
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <!-- Filter Bar -->
      <div class="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 class="text-sm font-semibold text-gray-400 mb-3">資料來源</h3>
        <div class="flex flex-wrap gap-3">
          <label class="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" v-model="sourceFilters.binance_cex"
              class="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900">
            <span class="text-sm">Binance CEX</span>
          </label>

          <label class="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" v-model="sourceFilters.okx_cex"
              class="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900">
            <span class="text-sm">OKX CEX</span>
          </label>

          <label class="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" v-model="sourceFilters.binance_hot"
              class="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900">
            <span class="text-sm">Binance Hot</span>
          </label>

          <label class="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" v-model="sourceFilters.okx_hot"
              class="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900">
            <span class="text-sm">OKX Hot</span>
          </label>

          <label class="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" v-model="sourceFilters.ledger_cold"
              class="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900">
            <span class="text-sm">Ledger Cold</span>
          </label>
        </div>
      </div>

      <!-- Total Balance Card -->
      <div class="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-8 shadow-2xl">
        <p class="text-sm text-white/80 mb-2">總資產價值</p>
        <p class="text-5xl font-bold mb-4">
          ${{ filteredTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
        </p>
        <p v-if="assetStore.lastUpdated" class="text-sm text-white/70">
          上次更新：{{ new Date(assetStore.lastUpdated).toLocaleString('zh-TW') }}
        </p>
      </div>

      <!-- Assets Grid -->
      <div class="grid lg:grid-cols-2 gap-6">

        <!-- Asset Allocation -->
        <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 class="text-lg font-bold mb-4">資產配置</h3>
          <AssetChart :assets="filteredAssetsWithPercentage" />
        </div>

        <!-- Top Assets -->
        <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 class="text-lg font-bold mb-4">資產明細</h3>
          <div class="space-y-3">
            <div v-for="summary in filteredAssetsWithPercentage.slice(0, 5)" :key="summary.symbol"
              class="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition">
              <div class="flex items-center space-x-3">
                <CoinIcon :symbol="summary.symbol" size="md" />
                <div>
                  <p class="font-semibold">{{ summary.symbol }}</p>
                  <p class="text-sm text-gray-400">{{ summary.totalAmount.toFixed(8) }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-semibold">${{ summary.valueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                </p>
                <p class="text-sm text-gray-400">{{ summary.percentage.toFixed(2) }}%</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Full Asset Table -->
      <div class="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
        <div class="px-6 py-4 border-b border-gray-700">
          <h3 class="text-lg font-bold">所有資產</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-900/50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">資產</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">數量</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">單價 (USD)
                </th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">價值 (USD)
                </th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">佔比</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700">
              <tr v-for="summary in filteredAssetsWithPercentage" :key="summary.symbol"
                class="hover:bg-gray-700/30 transition">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center space-x-3">
                    <CoinIcon :symbol="summary.symbol" size="sm" />
                    <span class="font-semibold">{{ summary.symbol }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right font-mono text-sm">
                  {{ summary.totalAmount.toFixed(8) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  ${{ summary.priceUSD.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right font-semibold">
                  ${{ summary.valueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <span class="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-sm font-semibold">
                    {{ summary.percentage.toFixed(2) }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </main>

    <!-- Settings Modal -->
    <SettingsModal :show="showSettings" @close="showSettings = false" />

    <!-- Toast -->
    <Toast :messages="toastStore.messages" @remove="toastStore.remove" />
  </div>
</template>
