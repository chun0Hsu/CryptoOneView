<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
import { SOURCE_REGISTRY, getSourceConfig } from '@/config/sources'
import { getExchangeConfig } from '@/config/exchanges'

const assetStore = useAssetStore()
const authStore = useAuthStore()
const toastStore = useToastStore()
const walletStore = useWalletStore()
const credentialStore = useCredentialStore()

const DUST_THRESHOLD = 0.000001

// 來源過濾器（從 registry 動態生成）
const sourceFilters = ref<Record<string, boolean>>(
  Object.fromEntries(SOURCE_REGISTRY.map(s => [s.id, true]))
)

// 檢查是否全選
const isAllSelected = computed(() => {
  return Object.values(sourceFilters.value).every(v => v === true)
})

// 全選/取消全選
function toggleSelectAll() {
  const newValue = !isAllSelected.value
  Object.keys(sourceFilters.value).forEach(key => {
    sourceFilters.value[key] = newValue
  })
}

// 切換單一來源
function toggleSource(sourceId: string) {
  sourceFilters.value[sourceId] = !sourceFilters.value[sourceId]
}

// 根據 Filter 過濾資產
const filteredAssets = computed(() => {
  const enabledSources = Object.entries(sourceFilters.value)
    .filter(([_, enabled]) => enabled)
    .map(([source]) => source)

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
function formatSource(source: string): string {
  return getSourceConfig(source)?.label || source
}

// 格式化 accountType 標籤
function formatAccountType(source: string, accountType?: string): string {
  if (!accountType) return ''
  // 從 source 推出 exchange id
  const sourceConfig = getSourceConfig(source)
  if (sourceConfig?.type === 'cex') {
    const exchangeId = source.replace('_cex', '')
    const exchangeConfig = getExchangeConfig(exchangeId)
    const accountConfig = exchangeConfig?.accountTypes.find(a => a.id === accountType)
    if (accountConfig) return accountConfig.label
  }
  return accountType
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
    const options = (event === 'scroll' || event === 'touchstart')
      ? { passive: true } as const
      : undefined
    window.addEventListener(event, handleUserActivity, options)
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
              class="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center border border-slate-600/50 shadow-lg">
              <svg width="24" height="24" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 2L32 10V26L18 34L4 26V10L18 2Z" stroke="url(#headerGrad1)" stroke-width="1.5" fill="none" />
                <path d="M8 18C8 18 12 12 18 12C24 12 28 18 28 18C28 18 24 24 18 24C12 24 8 18 8 18Z" stroke="url(#headerGrad2)" stroke-width="1.5" fill="none" />
                <circle cx="18" cy="18" r="3.5" fill="url(#headerGrad2)" />
                <defs>
                  <linearGradient id="headerGrad1" x1="4" y1="2" x2="32" y2="34">
                    <stop offset="0%" stop-color="#a5b4fc" />
                    <stop offset="100%" stop-color="#c4b5fd" />
                  </linearGradient>
                  <linearGradient id="headerGrad2" x1="8" y1="12" x2="28" y2="24">
                    <stop offset="0%" stop-color="#c7d2fe" />
                    <stop offset="100%" stop-color="#ddd6fe" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 class="text-lg sm:text-2xl font-bold bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">
              CryptoOneView
            </h1>
          </div>

          <div class="flex items-center space-x-2 sm:space-x-3">
            <!-- Refresh 按鈕 -->
            <button @click="handleRefresh" :disabled="assetStore.isLoading"
              class="group relative px-2 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:opacity-50 rounded-lg font-semibold text-sm transition-all duration-300 border border-slate-700 hover:border-cyan-500/50 disabled:border-slate-800 shadow-lg hover:shadow-cyan-500/20 overflow-hidden">
              <div
                class="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              </div>
              <span class="relative flex items-center gap-2">
                <span class="text-cyan-400">{{ assetStore.isLoading ? '⟳' : '↻' }}</span>
                <span class="hidden sm:inline text-slate-200">{{ assetStore.isLoading ? '更新中...' : 'Refresh' }}</span>
              </span>
            </button>

            <!-- Settings 按鈕 -->
            <button @click="showSettings = true"
              class="group relative px-2 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold text-sm transition-all duration-300 border border-slate-700 hover:border-slate-600 shadow-lg">
              <span class="flex items-center gap-2">
                <span class="text-slate-400 group-hover:text-slate-300">⚙</span>
                <span class="hidden sm:inline text-slate-200">Settings</span>
              </span>
            </button>

            <!-- Lock 按鈕 -->
            <button @click="handleLogout"
              class="group relative px-2 sm:px-4 py-2 bg-slate-800 hover:bg-rose-950/50 rounded-lg font-semibold text-sm transition-all duration-300 border border-slate-700 hover:border-rose-800/50 shadow-lg hover:shadow-rose-900/30">
              <span class="flex items-center gap-2">
                <span class="text-rose-400 group-hover:text-rose-300">🔒</span>
                <span class="hidden sm:inline text-slate-200 group-hover:text-rose-200">Lock</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <!-- Filter Bar - Registry 驅動 -->
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
            <div v-if="isAllSelected"
              class="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent"></div>
            <span class="relative flex items-center gap-2">
              <span :class="isAllSelected ? 'text-cyan-400' : 'text-slate-500'">{{ isAllSelected ? '✓' : '○' }}</span>
              <span>全選</span>
            </span>
          </button>

          <!-- 分隔線 -->
          <div class="w-px bg-slate-700 self-stretch mx-1"></div>

          <!-- 動態來源按鈕 -->
          <button
            v-for="source in SOURCE_REGISTRY"
            :key="source.id"
            @click="toggleSource(source.id)"
            :class="[
              'group relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 border overflow-hidden',
              sourceFilters[source.id]
                ? source.activeClasses
                : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50'
            ]"
          >
            <div v-if="sourceFilters[source.id]"
              :class="['absolute inset-0', source.activeGlowClass]"></div>
            <span class="relative flex items-center gap-2">
              <span :class="sourceFilters[source.id] ? source.activeTextClass : 'text-slate-500'">{{
                sourceFilters[source.id] ? '✓' : '○' }}</span>
              <span>{{ source.label }}</span>
            </span>
          </button>

        </div>
      </div>

      <!-- Total Balance Card -->
      <div
        class="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/40 to-violet-950/30 rounded-xl p-4 sm:p-6 md:p-8 shadow-2xl border border-indigo-500/20">
        <div
          class="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 rounded-full blur-3xl">
        </div>
        <div
          class="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/5 to-purple-500/10 rounded-full blur-3xl">
        </div>

        <div class="relative z-10">
          <p class="text-sm text-indigo-300/80 mb-2 flex items-center gap-2">
            <span class="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
            總資產價值
          </p>
          <p
            class="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-200 via-violet-200 to-purple-200 bg-clip-text text-transparent">
            ${{ filteredTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
          </p>
          <p v-if="assetStore.lastUpdated" class="text-sm text-slate-400">
            上次更新：{{ new Date(assetStore.lastUpdated).toLocaleString('zh-TW') }}
          </p>
        </div>
      </div>

      <!-- 空狀態提示 -->
      <div
        v-if="!assetStore.lastUpdated && credentialStore.credentials.length === 0 && walletStore.addresses.length === 0"
        class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50 text-center shadow-xl">
        <div class="max-w-md mx-auto space-y-6">
          <div class="text-6xl">🚀</div>
          <div>
            <h3 class="text-2xl font-bold text-slate-100 mb-2">歡迎使用 CryptoOneView</h3>
            <p class="text-slate-400">開始統一管理您的加密資產</p>
          </div>

          <div class="space-y-4 text-left">
            <div class="flex items-start space-x-3">
              <span class="text-2xl">1️⃣</span>
              <div>
                <p class="font-semibold text-slate-200">新增資料來源</p>
                <p class="text-sm text-slate-400">點擊右上角 Settings，新增交易所 API Key 或錢包地址</p>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <span class="text-2xl">2️⃣</span>
              <div>
                <p class="font-semibold text-slate-200">查詢資產</p>
                <p class="text-sm text-slate-400">點擊 Refresh 按鈕，系統會自動查詢並彙整您的資產</p>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <span class="text-2xl">3️⃣</span>
              <div>
                <p class="font-semibold text-slate-200">查看統計</p>
                <p class="text-sm text-slate-400">透過圖表和表格，一目了然掌握資產配置</p>
              </div>
            </div>
          </div>

          <button @click="showSettings = true"
            class="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg border border-slate-600">
            開始設定 →
          </button>

          <div class="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <div class="flex items-start space-x-3">
              <span class="text-cyan-400 text-lg">💡</span>
              <div class="text-xs text-slate-400 text-left space-y-1">
                <p><strong class="text-slate-300">安全提示：</strong></p>
                <p>• 所有資料加密儲存在您的瀏覽器中</p>
                <p>• API Key 請使用 Read-Only 權限</p>
                <p>• 系統不會傳送您的資料到任何第三方</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Assets Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Asset Allocation -->
        <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700/50 shadow-xl">
          <h3 class="text-lg font-bold mb-4 text-slate-200">資產配置</h3>
          <AssetChart :assets="filteredAssetsWithPercentage" />
        </div>

        <!-- 來源分布 -->
        <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700/50 shadow-xl">
          <h3 class="text-lg font-bold mb-4 text-slate-200">來源分布</h3>

          <div
            class="max-h-64 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">

            <div v-for="summary in filteredAssetsWithPercentage" :key="summary.symbol"
              class="bg-slate-900/50 rounded-lg p-3 hover:bg-slate-900/80 transition border border-slate-700/30">

              <!-- 幣種標題 -->
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2">
                  <CoinIcon :symbol="summary.symbol" size="sm" />
                  <span class="font-semibold text-slate-200">{{ summary.symbol }}</span>
                </div>
                <span class="text-sm text-slate-400">{{ summary.totalAmount.toFixed(4) }}</span>
              </div>

              <!-- 來源列表 -->
              <div class="space-y-1">
                <div v-for="source in summary.sources.filter(s => s.amount > DUST_THRESHOLD)" :key="`${source.source}-${source.accountType}`"
                  class="flex justify-between items-center text-xs pl-8">
                  <span class="text-slate-500">
                    {{ formatSource(source.source) }}
                    <span v-if="source.accountType" class="text-slate-600">
                      · {{ formatAccountType(source.source, source.accountType) }}
                    </span>
                  </span>
                  <span class="text-slate-400 font-mono">{{ source.amount.toFixed(6) }}</span>
                </div>
              </div>

            </div>

            <!-- 空狀態 -->
            <div v-if="filteredAssetsWithPercentage.length === 0"
              class="flex items-center justify-center h-full text-slate-500">
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
        <div class="px-3 py-2 sm:px-6 sm:py-4 border-b border-slate-700/50">
          <h3 class="text-lg font-bold text-slate-200">所有資產</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-900/50">
              <tr>
                <th class="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">資產</th>
                <th class="px-3 py-2 sm:px-6 sm:py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">數量</th>
                <th class="px-3 py-2 sm:px-6 sm:py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">單價 (USD)
                </th>
                <th class="px-3 py-2 sm:px-6 sm:py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">價值 (USD)
                </th>
                <th class="px-3 py-2 sm:px-6 sm:py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">佔比</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-700/30">
              <tr v-for="summary in filteredAssetsWithPercentage" :key="summary.symbol"
                class="hover:bg-slate-900/30 transition">
                <td class="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                  <div class="flex items-center space-x-3">
                    <CoinIcon :symbol="summary.symbol" size="sm" />
                    <span class="font-semibold text-slate-200">{{ summary.symbol }}</span>
                  </div>
                </td>
                <td class="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-right font-mono text-sm text-slate-300 hidden sm:table-cell">
                  {{ summary.totalAmount.toFixed(8) }}
                </td>
                <td class="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-right text-slate-300 hidden sm:table-cell">
                  ${{ summary.priceUSD.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                </td>
                <td class="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-right font-semibold text-slate-200">
                  ${{ summary.valueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                </td>
                <td class="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-right">
                  <span
                    class="px-2 py-1 bg-cyan-500/10 text-cyan-300 rounded text-sm font-semibold border border-cyan-500/20">
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
/* 自定義滾動條 */
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

/* Button 動畫 */
button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

button:active {
  transform: scale(0.98);
}
</style>
