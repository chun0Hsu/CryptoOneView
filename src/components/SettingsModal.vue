<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCredentialStore } from '@/stores/useCredentialStore'
import { useWalletStore } from '@/stores/useWalletStore'
import { EXCHANGE_REGISTRY, getExchangeConfig } from '@/config/exchanges'
import { getWalletSources, getSourceConfig } from '@/config/sources'
import { CHAIN_REGISTRY, getChainConfig } from '@/config/chains'

const credentialStore = useCredentialStore()
const walletStore = useWalletStore()

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

// Tab 切換
const activeTab = ref<'exchange' | 'wallet'>('exchange')

// 交易所 API Key 表單
const exchangeForm = ref({
  exchange: EXCHANGE_REGISTRY[0]?.id || 'binance',
  apiKey: '',
  secret: '',
  passphrase: ''
})

// 選中的交易所 config
const selectedExchangeConfig = computed(() => {
  return getExchangeConfig(exchangeForm.value.exchange)
})

// 錢包來源列表
const walletSources = computed(() => getWalletSources())

// 錢包地址表單
const walletForm = ref({
  source: walletSources.value[0]?.id || 'binance_hot',
  chain: CHAIN_REGISTRY[0]?.id || 'BTC',
  address: '',
  label: '',
  apiKey: ''
})

// 選中的鏈 config
const selectedChainConfig = computed(() => {
  return getChainConfig(walletForm.value.chain)
})

const message = ref('')

// 新增交易所憑證
function handleAddExchange() {
  if (!exchangeForm.value.apiKey || !exchangeForm.value.secret) {
    message.value = '請輸入完整的 API Key 和 Secret'
    return
  }

  // 需要 Passphrase 的交易所
  if (selectedExchangeConfig.value?.requiresPassphrase && !exchangeForm.value.passphrase) {
    message.value = `⚠️ ${selectedExchangeConfig.value.name} 需要 Passphrase`
    return
  }

  try {
    credentialStore.setCredential(
      exchangeForm.value.exchange,
      exchangeForm.value.apiKey,
      exchangeForm.value.secret,
      exchangeForm.value.passphrase || undefined
    )
    const name = selectedExchangeConfig.value?.name || exchangeForm.value.exchange.toUpperCase()
    message.value = `✅ ${name} 憑證已儲存`
    exchangeForm.value.apiKey = ''
    exchangeForm.value.secret = ''
    exchangeForm.value.passphrase = ''
  } catch (e: any) {
    message.value = `❌ ${e.message}`
  }
}

// 刪除交易所憑證
function handleRemoveExchange(exchange: string) {
  const name = getExchangeConfig(exchange)?.name || exchange.toUpperCase()
  if (confirm(`確定要刪除 ${name} 的憑證嗎？`)) {
    credentialStore.removeCredential(exchange)
    message.value = `🗑️ ${name} 憑證已刪除`
  }
}

// 取得交易所顯示名稱
function getExchangeDisplayName(exchangeId: string): string {
  return getExchangeConfig(exchangeId)?.name || exchangeId.toUpperCase()
}

// 取得交易所圖示
function getExchangeIcon(exchangeId: string): string {
  const config = getExchangeConfig(exchangeId)
  if (!config) return '🔵'
  return config.color === 'amber' ? '🟡' : '🔵'
}

// 新增錢包地址
function handleAddWallet() {
  if (!walletForm.value.address) {
    message.value = '請輸入錢包地址'
    return
  }

  try {
    walletStore.addAddress(
      walletForm.value.source,
      walletForm.value.chain,
      walletForm.value.address,
      walletForm.value.label || undefined,
      walletForm.value.apiKey || undefined
    )
    message.value = `✅ ${walletForm.value.chain} 地址已新增`
    walletForm.value.address = ''
    walletForm.value.label = ''
    walletForm.value.apiKey = ''
  } catch (e: any) {
    message.value = `❌ ${e.message}`
  }
}

// 刪除錢包地址
function handleRemoveWallet(id: string) {
  if (confirm('確定要刪除此錢包地址嗎？')) {
    walletStore.removeAddress(id)
    message.value = '🗑️ 錢包地址已刪除'
  }
}

// 關閉 Modal
function handleClose() {
  message.value = ''
  emit('close')
}
</script>

<template>
  <!-- Modal Overlay -->
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="handleClose">

      <!-- Modal Container -->
      <div
        class="relative bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-700/50">

        <!-- 背景裝飾 -->
        <div
          class="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 rounded-full blur-3xl pointer-events-none">
        </div>
        <div
          class="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/5 to-purple-500/10 rounded-full blur-3xl pointer-events-none">
        </div>

        <!-- Header -->
        <div
          class="relative z-10 flex justify-between items-center px-6 py-4 border-b border-slate-700/50 bg-slate-900/30 backdrop-blur-sm">
          <h2 class="text-2xl font-bold bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">
            ⚙️ 設定
          </h2>
          <button @click="handleClose"
            class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/50 hover:bg-slate-700 transition text-slate-400 hover:text-slate-200 border border-slate-600/50">
            ✕
          </button>
        </div>

        <!-- Tabs -->
        <div class="relative z-10 flex border-b border-slate-700/50 bg-slate-900/20 backdrop-blur-sm">
          <button @click="activeTab = 'exchange'" :class="[
            'flex-1 px-6 py-4 font-semibold transition-all duration-300 relative',
            activeTab === 'exchange'
              ? 'text-indigo-300 bg-slate-800/50'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
          ]">
            <span class="relative z-10">🏦 交易所 API</span>
            <div v-if="activeTab === 'exchange'"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500">
            </div>
          </button>
          <button @click="activeTab = 'wallet'" :class="[
            'flex-1 px-6 py-4 font-semibold transition-all duration-300 relative',
            activeTab === 'wallet'
              ? 'text-indigo-300 bg-slate-800/50'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
          ]">
            <span class="relative z-10">💼 錢包地址</span>
            <div v-if="activeTab === 'wallet'"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500">
            </div>
          </button>
        </div>

        <!-- Content -->
        <div class="relative z-10 p-6 overflow-y-auto max-h-[calc(90vh-180px)]">

          <!-- 交易所 Tab -->
          <div v-show="activeTab === 'exchange'" class="space-y-6">

            <!-- 新增表單 -->
            <div class="bg-slate-900/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 class="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                <span class="w-2 h-2 bg-indigo-400 rounded-full"></span>
                新增交易所 API Key
              </h3>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-slate-300 mb-2">選擇交易所</label>
                  <select v-model="exchangeForm.exchange"
                    class="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition">
                    <option v-for="ex in EXCHANGE_REGISTRY" :key="ex.id" :value="ex.id">{{ ex.name }}</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-300 mb-2">API Key</label>
                  <input v-model="exchangeForm.apiKey" type="text" placeholder="請輸入 API Key"
                    class="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition font-mono text-sm" />
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-300 mb-2">Secret Key</label>
                  <input v-model="exchangeForm.secret" type="password" placeholder="請輸入 Secret Key"
                    class="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition font-mono text-sm" />
                </div>

                <div v-if="selectedExchangeConfig?.requiresPassphrase">
                  <label class="block text-sm font-semibold text-slate-300 mb-2">Passphrase</label>
                  <input v-model="exchangeForm.passphrase" type="password" placeholder="請輸入 Passphrase"
                    class="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition font-mono text-sm" />
                  <p class="text-xs text-slate-500 mt-2">💡 {{ selectedExchangeConfig.name }} API 需要 Passphrase（在 {{ selectedExchangeConfig.name }} 建立 API Key 時設定）</p>
                </div>

                <button @click="handleAddExchange"
                  class="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg border border-slate-600 hover:border-indigo-500/50 hover:shadow-indigo-500/20">
                  ➕ 儲存 API Key
                </button>
              </div>
            </div>

            <!-- 已儲存的憑證列表 -->
            <div v-if="credentialStore.credentials.length > 0" class="space-y-3">
              <h3 class="text-lg font-bold text-slate-200 flex items-center gap-2">
                <span class="w-2 h-2 bg-violet-400 rounded-full"></span>
                已儲存的憑證
              </h3>
              <div v-for="cred in credentialStore.credentials" :key="cred.id"
                class="flex justify-between items-center p-4 bg-slate-900/30 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition group">
                <div class="flex items-center space-x-3">
                  <div
                    class="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-sm border border-slate-600/50">
                    {{ getExchangeIcon(cred.exchange) }}
                  </div>
                  <div>
                    <p class="font-semibold text-slate-200">{{ getExchangeDisplayName(cred.exchange) }}</p>
                    <p class="text-xs text-slate-500">ID: {{ cred.id.slice(0, 8) }}...</p>
                  </div>
                </div>
                <button @click="handleRemoveExchange(cred.exchange)"
                  class="px-3 py-2 bg-rose-950/30 hover:bg-rose-950/50 text-rose-300 rounded-lg text-sm font-semibold transition border border-rose-800/30 hover:border-rose-700/50 opacity-0 group-hover:opacity-100">
                  🗑️ 刪除
                </button>
              </div>
            </div>
          </div>

          <!-- 錢包 Tab -->
          <div v-show="activeTab === 'wallet'" class="space-y-6">

            <!-- 新增表單 -->
            <div class="bg-slate-900/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 class="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                <span class="w-2 h-2 bg-indigo-400 rounded-full"></span>
                新增錢包地址
              </h3>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-slate-300 mb-2">來源</label>
                  <select v-model="walletForm.source"
                    class="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition">
                    <option v-for="src in walletSources" :key="src.id" :value="src.id">{{ src.label }}</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-300 mb-2">鏈</label>
                  <select v-model="walletForm.chain"
                    class="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition">
                    <option v-for="chain in CHAIN_REGISTRY" :key="chain.id" :value="chain.id">{{ chain.name }} ({{ chain.symbol }})</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-300 mb-2">錢包地址</label>
                  <input v-model="walletForm.address" type="text" placeholder="請輸入錢包地址"
                    class="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition font-mono text-sm" />
                </div>

                <div v-if="selectedChainConfig?.apiKeyLabel">
                  <label class="block text-sm font-semibold text-slate-300 mb-2">
                    {{ selectedChainConfig.apiKeyLabel }}（選填，建議填寫）
                  </label>
                  <input v-model="walletForm.apiKey" type="text" :placeholder="`選填：您的 ${selectedChainConfig.apiKeyLabel}`"
                    class="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition font-mono text-sm" />
                  <p v-if="selectedChainConfig.apiKeyUrl" class="text-xs text-slate-500 mt-2">
                    💡 免費申請：
                    <a :href="selectedChainConfig.apiKeyUrl" target="_blank"
                      class="text-cyan-400 hover:text-cyan-300 underline">
                      {{ selectedChainConfig.apiKeyUrl }}
                    </a>
                    （避免查詢限制）
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-300 mb-2">標籤（選填）</label>
                  <input v-model="walletForm.label" type="text" placeholder="例如：我的主錢包"
                    class="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition" />
                </div>

                <button @click="handleAddWallet"
                  class="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg border border-slate-600 hover:border-indigo-500/50 hover:shadow-indigo-500/20">
                  ➕ 新增地址
                </button>
              </div>
            </div>

            <!-- 已儲存的錢包列表 -->
            <div v-if="walletStore.addresses.length > 0" class="space-y-3">
              <h3 class="text-lg font-bold text-slate-200 flex items-center gap-2">
                <span class="w-2 h-2 bg-violet-400 rounded-full"></span>
                已儲存的錢包
              </h3>
              <div v-for="addr in walletStore.addresses" :key="addr.id"
                class="p-4 bg-slate-900/30 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition group">
                <div class="flex justify-between items-start mb-2">
                  <div class="space-x-2">
                    <span
                      class="inline-block px-2 py-1 bg-indigo-600/20 text-indigo-300 rounded text-xs font-semibold border border-indigo-500/20">
                      {{ getSourceConfig(addr.source)?.label || addr.source.replace('_', ' ').toUpperCase() }}
                    </span>
                    <span
                      class="inline-block px-2 py-1 bg-violet-600/20 text-violet-300 rounded text-xs font-semibold border border-violet-500/20">
                      {{ addr.chain }}
                    </span>
                  </div>
                  <button @click="handleRemoveWallet(addr.id)"
                    class="px-3 py-1 bg-rose-950/30 hover:bg-rose-950/50 text-rose-300 text-sm rounded transition border border-rose-800/30 hover:border-rose-700/50 opacity-0 group-hover:opacity-100">
                    🗑️ 刪除
                  </button>
                </div>
                <p class="text-sm text-slate-400 break-all font-mono">{{ addr.address }}</p>
                <p v-if="addr.label" class="text-sm text-slate-500 mt-1">{{ addr.label }}</p>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer Message -->
        <div v-if="message"
          class="relative z-10 px-6 py-3 bg-slate-900/30 border-t border-slate-700/50 backdrop-blur-sm">
          <p class="text-sm text-center font-medium"
            :class="message.includes('✅') ? 'text-green-300' : message.includes('❌') ? 'text-rose-300' : message.includes('🗑️') ? 'text-orange-300' : 'text-slate-300'">
            {{ message }}
          </p>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active>div>div,
.modal-leave-active>div>div {
  transition: transform 0.3s ease;
}

.modal-enter-from>div>div {
  transform: scale(0.9);
}

.modal-leave-to>div>div {
  transform: scale(0.9);
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #0f172a;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #475569;
}
</style>
