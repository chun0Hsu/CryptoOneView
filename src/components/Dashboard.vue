<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { SourceType } from '@/types'
import SettingsModal from './SettingsModal.vue'
import AssetChart from './AssetChart.vue'
import CoinIcon from './CoinIcon.vue'
import Toast from './Toast.vue'
import LoadingOverlay from './LoadingOverlay.vue'
import { useToastStore } from '@/stores/useToastStore'
import { useWalletStore } from '@/stores/useWalletStore'
import { useCredentialStore } from '@/stores/useCredentialStore'
import { useAssetStore } from '@/stores/useAssetStore'
import { useAuthStore } from '@/stores/useAuthStore'

const assetStore = useAssetStore()
const authStore = useAuthStore()
const toastStore = useToastStore()
const walletStore = useWalletStore()
const credentialStore = useCredentialStore()

const DUST_THRESHOLD = 0.000001

// 來源過濾器（預設全選）
const sourceFilters = ref({
  binance_cex: true,
  okx_cex: true,
  binance_hot: true,
  okx_hot: true,
  ledger_cold: true
})

// 檢查是否全選
const isAllSelected = computed(() => {
  return Object.values(sourceFilters.value).every(v => v === true)
})

// 全選/取消全選
function toggleSelectAll() {
  const newValue = !isAllSelected.value
  Object.keys(sourceFilters.value).forEach(key => {
    sourceFilters.value[key as keyof typeof sourceFilters.value] = newValue
  })
}

// 切換單一來源
function toggleSource(source: keyof typeof sourceFilters.value) {
  sourceFilters.value[source] = !sourceFilters.value[source]
}

// 根據 Filter 過濾資產
const filteredAssets = computed(() => {
  const enabledSources = Object.entries(sourceFilters.value)
    .filter(([_, enabled]) => enabled)
    .map(([source, _]) => source as SourceType)

  if (enabledSources.length === 0) {
    return assetStore.assetSummaries
  }

  return assetStore.assetSummaries.map(summary => {
    const filteredSources = summary.sources.filter(s =>
      enabledSources.includes(s.source)
    )

    const totalAmount = filteredSources.reduce((sum, s) => sum + s.amount, 0)

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

// 格式化來源名稱
function formatSource(source: SourceType): string {
  const nameMap: Record<SourceType, string> = {
    binance_cex: 'Binance CEX',
    okx_cex: 'OKX CEX',
    binance_hot: 'Binance Hot',
    okx_hot: 'OKX Hot',
    ledger_cold: 'Ledger Cold'
  }
  return nameMap[source] || source
}

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
  activityEvents.forEach(event => {
    window.addEventListener(event, handleUserActivity)
  })
})

onUnmounted(() => {
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
              class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg">
              C
            </div>
            <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              CryptoOneView
            </h1>
          </div>

          <div class="flex items-center space-x-3">
            <!-- 🔥 Refresh 按鈕 - 深灰科技感 -->
            <button @click="handleRefresh" :disabled="assetStore.isLoading"
              class="group relative px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:opacity-50 rounded-lg font-semibold text-sm transition-all duration-300 border border-slate-700 hover:border-cyan-500/50 disabled:border-slate-800 shadow-lg hover:shadow-cyan-500/20 overflow-hidden">
              <!-- 發光效果 -->
              <div
                class="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              </div>
              <span class="relative flex items-center gap-2">
                <span class="text-cyan-400">{{ assetStore.isLoading ? '⟳' : '↻' }}</span>
                <span class="text-slate-200">{{ assetStore.isLoading ? '更新中...' : 'Refresh' }}</span>
              </span>
            </button>

            <!-- 🔥 Settings 按鈕 - 深灰 -->
            <button @click="showSettings = true"
              class="group relative px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold text-sm transition-all duration-300 border border-slate-700 hover:border-slate-600 shadow-lg">
              <span class="flex items-center gap-2">
                <span class="text-slate-400 group-hover:text-slate-300 transition-colors">⚙</span>
                <span class="text-slate-200">Settings</span>
              </span>
            </button>

            <!-- 🔥 Lock 按鈕 - 暗紅科技感 -->
            <button @click="handleLogout"
              class="group relative px-4 py-2 bg-slate-800 hover:bg-rose-950/50 rounded-lg font-semibold text-sm transition-all duration-300 border border-slate-700 hover:border-rose-800/50 shadow-lg hover:shadow-rose-900/30">
              <span class="flex items-center gap-2">
                <span class="text-rose-400 group-hover:text-rose-300 transition-colors">🔒</span>
                <span class="text-slate-200 group-hover:text-rose-200 transition-colors">Lock</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <!-- 🔥 Filter Bar - 深色科技感 -->
      <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 shadow-xl">
        <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">資料來源篩選</h3>
        <div class="flex flex-wrap gap-2">

          <!-- 全選按鈕 -->
          <button @click="toggleSelectAll" :class="[
            'group relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 border overflow-hidden',
            isAllSelected
              ? 'bg-slate-700 border-cyan-500/50 text-cyan-100 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50'
          ]">
            <!-- 發光效果 -->
            <div v-if="isAllSelected"
              class="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent"></div>
            <span class="relative flex items-center gap-2">
              <span :class="isAllSelected ? 'text-cyan-400' : 'text-slate-500'">{{ isAllSelected ? '✓' : '○' }}</span>
              <span>全選</span>
            </span>
          </button>

          <!-- 分隔線 -->
          <div class="w-px bg-slate-700 self-stretch mx-1"></div>

          <!-- Binance CEX -->
          <button @click="toggleSource('binance_cex')" :class="[
            'group relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 border overflow-hidden',
            sourceFilters.binance_cex
              ? 'bg-slate-700 border-amber-500/50 text-amber-100 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50'
          ]">
            <div v-if="sourceFilters.binance_cex"
              class="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent"></div>
            <span class="relative flex items-center gap-2">
              <span :class="sourceFilters.binance_cex ? 'text-amber-400' : 'text-slate-500'">{{
                sourceFilters.binance_cex ? '✓' : '○' }}</span>
              <span>Binance CEX</span>
            </span>
          </button>

          <!-- OKX CEX -->
          <button @click="toggleSource('okx_cex')" :class="[
            'group relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 border overflow-hidden',
            sourceFilters.okx_cex
              ? 'bg-slate-700 border-blue-500/50 text-blue-100 shadow-lg shadow-blue-500/20'
              : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50'
          ]">
            <div v-if="sourceFilters.okx_cex"
              class="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent"></div>
            <span class="relative flex items-center gap-2">
              <span :class="sourceFilters.okx_cex ? 'text-blue-400' : 'text-slate-500'">{{ sourceFilters.okx_cex ? '✓' :
                '○' }}</span>
              <span>OKX CEX</span>
            </span>
          </button>

          <!-- Binance Hot -->
          <button @click="toggleSource('binance_hot')" :class="[
            'group relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 border overflow-hidden',
            sourceFilters.binance_hot
              ? 'bg-slate-700 border-orange-500/50 text-orange-100 shadow-lg shadow-orange-500/20'
              : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50'
          ]">
            <div v-if="sourceFilters.binance_hot"
              class="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent"></div>
            <span class="relative flex items-center gap-2">
              <span :class="sourceFilters.binance_hot ? 'text-orange-400' : 'text-slate-500'">{{
                sourceFilters.binance_hot ? '✓' : '○' }}</span>
              <span>Binance Hot</span>
            </span>
          </button>

          <!-- OKX Hot -->
          <button @click="toggleSource('okx_hot')" :class="[
            'group relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 border overflow-hidden',
            sourceFilters.okx_hot
              ? 'bg-slate-700 border-teal-500/50 text-teal-100 shadow-lg shadow-teal-500/20'
              : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50'
          ]">
            <div v-if="sourceFilters.okx_hot"
              class="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent"></div>
            <span class="relative flex items-center gap-2">
              <span :class="sourceFilters.okx_hot ? 'text-teal-400' : 'text-slate-500'">{{ sourceFilters.okx_hot ? '✓' :
                '○' }}</span>
              <span>OKX Hot</span>
            </span>
          </button>

        </div>
      </div>

      <!-- 🎨 Total Balance Card - 保留原配色 -->
      <div class="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-8 shadow-2xl">
        <p class="text-sm text-white/80 mb-2">總資產價值</p>
        <p class="text-5xl font-bold mb-4">
          ${{ filteredTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
        </p>
        <p v-if="assetStore.lastUpdated" class="text-sm text-white/70">
          上次更新：{{ new Date(assetStore.lastUpdated).toLocaleString('zh-TW') }}
        </p>
      </div>

      <!-- 空狀態提示 -->
      <div
        v-if="!assetStore.lastUpdated && credentialStore.credentials.length === 0 && walletStore.addresses.length === 0"
        class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50 text-center shadow-xl">
        <div class="max-w-md mx-auto space-y-6">
          <div class="text-6xl">🚀</div>
          <div>
            <h3 class="text-2xl font-bold text-white mb-2">歡迎使用 CryptoOneView</h3>
            <p class="text-gray-400">開始統一管理您的加密資產</p>
          </div>

          <div class="space-y-4 text-left">
            <div class="flex items-start space-x-3">
              <span class="text-2xl">1️⃣</span>
              <div>
                <p class="font-semibold text-white">新增資料來源</p>
                <p class="text-sm text-gray-400">點擊右上角 Settings，新增交易所 API Key 或錢包地址</p>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <span class="text-2xl">2️⃣</span>
              <div>
                <p class="font-semibold text-white">查詢資產</p>
                <p class="text-sm text-gray-400">點擊 Refresh 按鈕，系統會自動查詢並彙整您的資產</p>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <span class="text-2xl">3️⃣</span>
              <div>
                <p class="font-semibold text-white">查看統計</p>
                <p class="text-sm text-gray-400">透過圖表和表格，一目了然掌握資產配置</p>
              </div>
            </div>
          </div>

          <button @click="showSettings = true"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition shadow-lg">
            開始設定 →
          </button>

          <div class="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <div class="flex items-start space-x-3">
              <span class="text-yellow-500 text-lg">💡</span>
              <div class="text-xs text-gray-400 text-left space-y-1">
                <p><strong>安全提示：</strong></p>
                <p>• 所有資料加密儲存在您的瀏覽器中</p>
                <p>• API Key 請使用 Read-Only 權限</p>
                <p>• 系統不會傳送您的資料到任何第三方</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Assets Grid -->
      <div class="grid lg:grid-cols-2 gap-6">

        <!-- Asset Allocation -->
        <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl">
          <h3 class="text-lg font-bold mb-4">資產配置</h3>
          <AssetChart :assets="filteredAssetsWithPercentage" />
        </div>

        <!-- 來源分布 -->
        <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl">
          <h3 class="text-lg font-bold mb-4">來源分布</h3>

          <!-- 限制高度與圓餅圖一致，並加上滾動 -->
          <div
            class="h-64 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">

            <div v-for="summary in filteredAssetsWithPercentage" :key="summary.symbol"
              class="bg-slate-900/50 rounded-lg p-3 hover:bg-slate-900/80 transition border border-slate-700/30">

              <!-- 幣種標題 -->
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2">
                  <CoinIcon :symbol="summary.symbol" size="sm" />
                  <span class="font-semibold text-white">{{ summary.symbol }}</span>
                </div>
                <span class="text-sm text-gray-400">{{ summary.totalAmount.toFixed(4) }}</span>
              </div>

              <!-- 來源列表 -->
              <div class="space-y-1">
                <div v-for="source in summary.sources.filter(s => s.amount > DUST_THRESHOLD)" :key="source.source"
                  class="flex justify-between items-center text-xs pl-8">
                  <span class="text-gray-400">{{ formatSource(source.source) }}</span>
                  <span class="text-gray-300 font-mono">{{ source.amount.toFixed(6) }}</span>
                </div>
              </div>

            </div>

            <!-- 空狀態 -->
            <div v-if="filteredAssetsWithPercentage.length === 0"
              class="flex items-center justify-center h-full text-gray-500">
              <div class="text-center">
                <p class="text-lg mb-2">📊</p>
                <p class="text-sm">尚無資產資料</p>
              </div>
            </div>

          </div>
        </div>

      </div>

      <!-- Full Asset Table -->
      <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50 shadow-xl">
        <div class="px-6 py-4 border-b border-slate-700/50">
          <h3 class="text-lg font-bold">所有資產</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-900/50">
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
            <tbody class="divide-y divide-slate-700/30">
              <tr v-for="summary in filteredAssetsWithPercentage" :key="summary.symbol"
                class="hover:bg-slate-900/30 transition">
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

    <!-- Loading Overlay -->
    <LoadingOverlay :show="assetStore.isLoading" message="查詢資產中..." />
  </div>
</template>

<style scoped>
/* 自定義滾動條樣式 */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: #0f172a;
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #475569;
}

/* Button 動畫效果 */
button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

button:active {
  transform: scale(0.98);
}
</style>
