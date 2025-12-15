<script setup lang="ts">
import { ref } from 'vue'
import { useCredentialStore } from '@/stores/useCredentialStore'
import { useWalletStore } from '@/stores/useWalletStore'
import type { ExchangeName } from '@/types'

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
  exchange: 'binance' as ExchangeName,
  apiKey: '',
  secret: '',
  passphrase: ''
})

// 錢包地址表單
const walletForm = ref({
  source: 'binance_hot' as 'binance_hot' | 'okx_hot' | 'ledger_cold',
  chain: 'BTC' as 'BTC' | 'ETH' | 'ADA',
  address: '',
  label: '',
  apiKey: ''
})

const message = ref('')

// 新增交易所憑證
function handleAddExchange() {
  if (!exchangeForm.value.apiKey || !exchangeForm.value.secret) {
    message.value = '請輸入完整的 API Key 和 Secret'
    return
  }

  // OKX 需要 Passphrase
  if (exchangeForm.value.exchange === 'okx' && !exchangeForm.value.passphrase) {
    message.value = '⚠️ OKX 需要 Passphrase'
    return
  }

  try {
    credentialStore.setCredential(
      exchangeForm.value.exchange,
      exchangeForm.value.apiKey,
      exchangeForm.value.secret,
      exchangeForm.value.passphrase || undefined
    )
    message.value = `✅ ${exchangeForm.value.exchange.toUpperCase()} 憑證已儲存`
    exchangeForm.value.apiKey = ''
    exchangeForm.value.secret = ''
    exchangeForm.value.passphrase = ''
  } catch (e: any) {
    message.value = `❌ ${e.message}`
  }
}


// 刪除交易所憑證
function handleRemoveExchange(exchange: ExchangeName) {
  if (confirm(`確定要刪除 ${exchange.toUpperCase()} 的憑證嗎？`)) {
    credentialStore.removeCredential(exchange)
    message.value = `🗑️ ${exchange.toUpperCase()} 憑證已刪除`
  }
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
        class="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700">

        <!-- Header -->
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-700">
          <h2 class="text-2xl font-bold text-white">⚙️ 設定</h2>
          <button @click="handleClose"
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 transition text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-gray-700">
          <button @click="activeTab = 'exchange'" :class="[
            'flex-1 px-6 py-3 font-semibold transition',
            activeTab === 'exchange'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          ]">
            交易所 API
          </button>
          <button @click="activeTab = 'wallet'" :class="[
            'flex-1 px-6 py-3 font-semibold transition',
            activeTab === 'wallet'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          ]">
            錢包地址
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">

          <!-- 交易所 Tab -->
          <div v-show="activeTab === 'exchange'" class="space-y-6">

            <!-- 新增表單 -->
            <div class="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
              <h3 class="text-lg font-bold text-white mb-4">新增交易所 API Key</h3>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-300 mb-2">選擇交易所</label>
                  <select v-model="exchangeForm.exchange"
                    class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="binance">Binance</option>
                    <option value="okx">OKX</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-300 mb-2">API Key</label>
                  <input v-model="exchangeForm.apiKey" type="text" placeholder="請輸入 API Key"
                    class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-300 mb-2">Secret Key</label>
                  <input v-model="exchangeForm.secret" type="password" placeholder="請輸入 Secret Key"
                    class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div v-if="exchangeForm.exchange === 'okx'">
                  <label class="block text-sm font-semibold text-gray-300 mb-2">Passphrase</label>
                  <input v-model="exchangeForm.passphrase" type="password" placeholder="請輸入 Passphrase"
                    class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <p class="text-xs text-gray-500 mt-1">💡 OKX API 需要 Passphrase（在 OKX 建立 API Key 時設定）</p>
                </div>

                <button @click="handleAddExchange"
                  class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition">
                  儲存 API Key
                </button>
              </div>
            </div>

            <!-- 已儲存的憑證列表 -->
            <div v-if="credentialStore.credentials.length > 0" class="space-y-3">
              <h3 class="text-lg font-bold text-white">已儲存的憑證</h3>
              <div v-for="cred in credentialStore.credentials" :key="cred.id"
                class="flex justify-between items-center p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div>
                  <p class="font-semibold text-white">{{ cred.exchange.toUpperCase() }}</p>
                  <p class="text-sm text-gray-400">ID: {{ cred.id }}</p>
                </div>
                <button @click="handleRemoveExchange(cred.exchange)"
                  class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
                  刪除
                </button>
              </div>
            </div>
          </div>

          <!-- 錢包 Tab -->
          <div v-show="activeTab === 'wallet'" class="space-y-6">

            <!-- 新增表單 -->
            <div class="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
              <h3 class="text-lg font-bold text-white mb-4">新增錢包地址</h3>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-300 mb-2">來源</label>
                  <select v-model="walletForm.source"
                    class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="binance_hot">Binance Hot</option>
                    <option value="okx_hot">OKX Hot</option>
                    <!-- <option value="ledger_cold">Ledger Cold</option> V2.0 -->
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-300 mb-2">鏈</label>
                  <select v-model="walletForm.chain"
                    class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="BTC">Bitcoin (BTC)</option>
                    <option value="ETH">Ethereum (ETH)</option>
                    <!-- <option value="ADA">Cardano (ADA)</option> V2.0 -->
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-300 mb-2">錢包地址</label>
                  <input v-model="walletForm.address" type="text" placeholder="請輸入錢包地址"
                    class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div v-if="walletForm.chain === 'ETH'">
                  <label class="block text-sm font-semibold text-gray-300 mb-2">
                    Etherscan API Key（選填，建議填寫）
                  </label>
                  <input v-model="walletForm.apiKey" type="text" placeholder="選填：您的 Etherscan API Key"
                    class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <p class="text-xs text-gray-500 mt-1">
                    💡 免費申請：
                    <a href="https://etherscan.io/myapikey" target="_blank" class="text-blue-400 hover:underline">
                      https://etherscan.io/myapikey
                    </a>
                    （避免查詢限制）
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-300 mb-2">標籤（選填）</label>
                  <input v-model="walletForm.label" type="text" placeholder="例如：我的主錢包"
                    class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <button @click="handleAddWallet"
                  class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition">
                  新增地址
                </button>
              </div>
            </div>

            <!-- 已儲存的錢包列表 -->
            <div v-if="walletStore.addresses.length > 0" class="space-y-3">
              <h3 class="text-lg font-bold text-white">已儲存的錢包</h3>
              <div v-for="addr in walletStore.addresses" :key="addr.id"
                class="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <span
                      class="inline-block px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-semibold mr-2">
                      {{ addr.source.replace('_', ' ').toUpperCase() }}
                    </span>
                    <span class="inline-block px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs font-semibold">
                      {{ addr.chain }}
                    </span>
                  </div>
                  <button @click="handleRemoveWallet(addr.id)"
                    class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition">
                    刪除
                  </button>
                </div>
                <p class="text-sm text-gray-400 break-all font-mono">{{ addr.address }}</p>
                <p v-if="addr.label" class="text-sm text-gray-500 mt-1">{{ addr.label }}</p>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer Message -->
        <div v-if="message" class="px-6 py-3 bg-gray-900 border-t border-gray-700">
          <p class="text-sm text-center"
            :class="message.includes('✅') ? 'text-green-400' : message.includes('❌') ? 'text-red-400' : 'text-gray-400'">
            {{ message }}
          </p>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-gray-800,
.modal-leave-active .bg-gray-800 {
  transition: transform 0.3s ease;
}

.modal-enter-from .bg-gray-800 {
  transform: scale(0.9);
}

.modal-leave-to .bg-gray-800 {
  transform: scale(0.9);
}
</style>
