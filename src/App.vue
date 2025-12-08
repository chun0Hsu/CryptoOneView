<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from './stores/useAuthStore'
import { useCredentialStore } from './stores/useCredentialStore'
import { useWalletStore } from './stores/useWalletStore'
import { fetchExchangeBalance, type ExchangeBalance } from './services/exchangeService'
import type { ExchangeName, CryptoSymbol } from './types'
import { fetchAllPrices, type PriceData } from './services/priceService'
import { fetchChainBalance, type ChainBalanceResult } from './services/chainService'


const authStore = useAuthStore()
const credentialStore = useCredentialStore()
const walletStore = useWalletStore()

const passwordInput = ref('')
const message = ref('')

// 價格查詢結果
const priceResult = ref<Map<CryptoSymbol, PriceData> | null>(null)
const isQueryingPrice = ref(false)

// 鏈上查詢結果
const chainQueryResult = ref<ChainBalanceResult | null>(null)
const isQueryingChain = ref(false)


// === 認證相關 ===
function handleSetPassword() {
  if (passwordInput.value.length < 6) {
    message.value = '❌ 密碼至少需要 6 個字元'
    return
  }
  authStore.setPassword(passwordInput.value)
  message.value = '✅ 密碼設定成功！'
  passwordInput.value = ''
}

function handleUnlock() {
  const success = authStore.unlock(passwordInput.value)
  if (success) {
    message.value = '✅ 解鎖成功！'
  } else {
    message.value = '❌ 密碼錯誤'
  }
  passwordInput.value = ''
}

function handleLock() {
  authStore.lock()
  queryResult.value = null
  message.value = '🔒 已鎖定'
}

// === 交易所憑證相關 ===
const selectedExchange = ref<ExchangeName>('binance')
const apiKeyInput = ref('')
const secretInput = ref('')

function handleAddCredential() {
  if (!apiKeyInput.value || !secretInput.value) {
    message.value = '❌ 請輸入完整的 API Key 和 Secret'
    return
  }

  try {
    credentialStore.setCredential(selectedExchange.value, apiKeyInput.value, secretInput.value)
    message.value = `✅ ${selectedExchange.value.toUpperCase()} 憑證已加密儲存`
    apiKeyInput.value = ''
    secretInput.value = ''
  } catch (e: any) {
    message.value = `❌ ${e.message}`
  }
}

function handleRemoveCredential(exchange: ExchangeName) {
  credentialStore.removeCredential(exchange)
  message.value = `🗑️ ${exchange.toUpperCase()} 憑證已刪除`
}

// === 測試查詢交易所餘額 ===
async function handleQueryBalance(exchange: ExchangeName) {
  queryResult.value = null
  isQuerying.value = true
  message.value = '🔄 查詢中...'

  try {
    const cred = credentialStore.getCredential(exchange)
    if (!cred) {
      message.value = `❌ 找不到 ${exchange.toUpperCase()} 的憑證`
      isQuerying.value = false
      return
    }

    const result = await fetchExchangeBalance(exchange, cred.apiKey, cred.secret)

    if (result.success) {
      queryResult.value = result.balances
      message.value = `✅ 查詢成功！找到 ${result.balances.length} 種幣`
    } else {
      message.value = `❌ 查詢失敗：${result.error}`
    }
  } catch (e: any) {
    message.value = `❌ 查詢錯誤：${e.message}`
  } finally {
    isQuerying.value = false
  }
}

// === 錢包地址相關 ===
const walletSource = ref<'binance_hot' | 'okx_hot' | 'ledger_cold'>('ledger_cold')
const walletChain = ref<'BTC' | 'ETH' | 'ADA'>('BTC')
const walletAddress = ref('')
const walletLabel = ref('')

function handleAddWallet() {
  if (!walletAddress.value) {
    message.value = '❌ 請輸入錢包地址'
    return
  }

  try {
    walletStore.addAddress(
      walletSource.value,
      walletChain.value,
      walletAddress.value,
      walletLabel.value || undefined
    )
    message.value = `✅ ${walletSource.value} ${walletChain.value} 地址已新增`
    walletAddress.value = ''
    walletLabel.value = ''
  } catch (e: any) {
    message.value = `❌ ${e.message}`
  }
}

function handleRemoveWallet(id: string) {
  walletStore.removeAddress(id)
  message.value = '🗑️ 錢包地址已刪除'
}

// === 價格查詢 ===
async function handleQueryPrice() {
  isQueryingPrice.value = true
  message.value = '🔄 查詢價格中...'

  try {
    const prices = await fetchAllPrices()
    priceResult.value = prices
    message.value = `✅ 查詢成功！取得 ${prices.size} 個幣種價格`
  } catch (e: any) {
    message.value = `❌ 查詢失敗：${e.message}`
  } finally {
    isQueryingPrice.value = false
  }
}

// === 鏈上查詢測試 ===
async function handleQueryChain(address: string, chain: 'BTC' | 'ETH' | 'ADA') {
  chainQueryResult.value = null
  isQueryingChain.value = true
  message.value = `🔄 查詢 ${chain} 地址餘額中...`

  try {
    const result = await fetchChainBalance(chain, address)
    chainQueryResult.value = result

    if (result.success && result.data) {
      const totalBalance = result.data.balances.reduce((sum, b) => sum + b.amount, 0)
      message.value = `✅ ${chain} 查詢成功！餘額：${totalBalance.toFixed(8)}`
    } else {
      message.value = `❌ ${result.error}`
    }
  } catch (e: any) {
    message.value = `❌ 查詢錯誤：${e.message}`
  } finally {
    isQueryingChain.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
    <div class="max-w-4xl mx-auto py-8 space-y-6">

      <!-- 標題 -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">CryptoOneView</h1>
        <p class="text-white/80">Store 功能測試</p>
      </div>

      <!-- 認證狀態卡片 -->
      <div class="bg-white rounded-2xl shadow-2xl p-6">
        <div class="mb-4 p-4 rounded-lg" :class="authStore.isUnlocked ? 'bg-green-100' : 'bg-gray-100'">
          <p class="text-center font-semibold">
            {{ authStore.isUnlocked ? '🔓 已解鎖' : '🔒 已鎖定' }}
          </p>
        </div>

        <!-- 首次設定密碼 -->
        <div v-if="!authStore.passwordHash" class="space-y-4">
          <p class="text-sm text-gray-600">尚未設定密碼，請設定解鎖密碼：</p>
          <input v-model="passwordInput" type="password" placeholder="輸入密碼（至少6字元）"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button @click="handleSetPassword"
            class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition">
            設定密碼
          </button>
        </div>

        <!-- 解鎖介面 -->
        <div v-else-if="!authStore.isUnlocked" class="space-y-4">
          <input v-model="passwordInput" type="password" placeholder="輸入密碼解鎖"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            @keyup.enter="handleUnlock" />
          <button @click="handleUnlock"
            class="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition">
            解鎖
          </button>
        </div>

        <!-- 已解鎖：鎖定按鈕 -->
        <div v-else>
          <button @click="handleLock"
            class="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition">
            鎖定
          </button>
        </div>
      </div>

      <div v-if="authStore.isUnlocked" class="grid md:grid-cols-2 gap-6">

        <!-- 左側：交易所憑證 -->
        <div class="space-y-6">
          <!-- 新增憑證 -->
          <div class="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <h2 class="text-xl font-bold text-gray-800">交易所 API Key</h2>

            <select v-model="selectedExchange"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="binance">Binance CEX</option>
              <option value="okx">OKX CEX</option>
            </select>

            <input v-model="apiKeyInput" type="text" placeholder="API Key"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />

            <input v-model="secretInput" type="password" placeholder="Secret Key"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />

            <button @click="handleAddCredential"
              class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition">
              儲存憑證
            </button>
          </div>

          <!-- 已儲存的憑證 -->
          <div v-if="credentialStore.credentials.length > 0" class="bg-white rounded-2xl shadow-2xl p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">已儲存憑證</h3>
            <div class="space-y-3">
              <div v-for="cred in credentialStore.credentials" :key="cred.id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span class="font-semibold">{{ cred.exchange.toUpperCase() }}</span>
                <div class="flex gap-2">
                  <button @click="handleQueryBalance(cred.exchange)" :disabled="isQuerying"
                    class="px-3 py-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white text-sm rounded transition">
                    {{ isQuerying ? '查詢中...' : '查詢餘額' }}
                  </button>
                  <button @click="handleRemoveCredential(cred.exchange)"
                    class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition">
                    刪除
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 查詢結果顯示 -->
          <div v-if="queryResult && queryResult.length > 0" class="bg-white rounded-2xl shadow-2xl p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">查詢結果</h3>
            <div class="space-y-2">
              <div v-for="balance in queryResult" :key="balance.symbol"
                class="flex justify-between p-3 bg-green-50 rounded-lg">
                <span class="font-semibold">{{ balance.symbol }}</span>
                <span class="text-gray-700">{{ balance.total.toFixed(8) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右側：錢包地址 -->
        <div class="space-y-6">
          <!-- 新增錢包地址 -->
          <div class="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <h2 class="text-xl font-bold text-gray-800">錢包地址</h2>

            <select v-model="walletSource"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="binance_hot">Binance Hot</option>
              <option value="okx_hot">OKX Hot</option>
              <option value="ledger_cold">Ledger Cold</option>
            </select>

            <select v-model="walletChain"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="ETH">Ethereum (ETH)</option>
              <option value="ADA">Cardano (ADA)</option>
            </select>

            <input v-model="walletAddress" type="text" placeholder="錢包地址"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />

            <input v-model="walletLabel" type="text" placeholder="標籤（選填）"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />

            <button @click="handleAddWallet"
              class="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition">
              新增地址
            </button>
          </div>

          <!-- 已儲存的錢包地址 -->
          <div v-if="walletStore.addresses.length > 0" class="bg-white rounded-2xl shadow-2xl p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">已儲存地址</h3>
            <div class="space-y-3">
              <div v-for="addr in walletStore.addresses" :key="addr.id" class="p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <div>
                    <span class="font-semibold text-sm">{{ addr.source.replace('_', ' ').toUpperCase() }}</span>
                    <span class="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{{ addr.chain }}</span>
                  </div>
                  <button @click="handleRemoveWallet(addr.id)"
                    class="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition">
                    刪除
                  </button>
                </div>
                <p class="text-xs text-gray-600 break-all">{{ addr.address }}</p>
                <p v-if="addr.label" class="text-xs text-gray-500 mt-1">{{ addr.label }}</p>
              </div>
            </div>
            <!-- 測試查詢鏈上餘額 -->
            <div class="bg-white rounded-2xl shadow-2xl p-6">
              <h3 class="text-lg font-bold text-gray-800 mb-4">測試鏈上查詢</h3>
              <div class="space-y-3">
                <div v-for="addr in walletStore.addresses" :key="addr.id" class="p-3 bg-purple-50 rounded-lg">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-semibold text-sm">{{ addr.chain }}</span>
                    <button @click="handleQueryChain(addr.address, addr.chain)" :disabled="isQueryingChain"
                      class="px-3 py-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white text-xs rounded transition">
                      {{ isQueryingChain ? '查詢中...' : '查詢餘額' }}
                    </button>
                  </div>
                  <p class="text-xs text-gray-600 break-all">{{ addr.address }}</p>
                </div>
              </div>

              <!-- 查詢結果 -->
              <div v-if="chainQueryResult && chainQueryResult.success && chainQueryResult.data"
                class="mt-4 p-4 bg-green-50 rounded-lg">
                <h4 class="font-bold text-sm mb-2">查詢結果：{{ chainQueryResult.data.chain }}</h4>
                <div class="space-y-1">
                  <div v-for="balance in chainQueryResult.data.balances" :key="balance.symbol"
                    class="flex justify-between text-sm">
                    <span>{{ balance.symbol }}:</span>
                    <span class="font-mono">{{ balance.amount.toFixed(8) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- 訊息顯示 -->
      <div v-if="message" class="bg-white rounded-lg shadow p-4">
        <p class="text-center font-medium"
          :class="message.includes('✅') ? 'text-green-600' : message.includes('❌') ? 'text-red-600' : 'text-gray-600'">
          {{ message }}
        </p>
      </div>

    </div>
    <!-- 價格查詢測試 -->
    <div v-if="authStore.isUnlocked" class="bg-white rounded-2xl shadow-2xl p-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4">價格查詢測試</h2>
      <button @click="handleQueryPrice" :disabled="isQueryingPrice"
        class="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition">
        {{ isQueryingPrice ? '查詢中...' : '查詢所有幣種價格（CoinGecko）' }}
      </button>

      <!-- 價格結果 -->
      <div v-if="priceResult && priceResult.size > 0" class="mt-4 space-y-2">
        <div v-for="[symbol, price] in priceResult" :key="symbol"
          class="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
          <span class="font-semibold">{{ symbol }}</span>
          <span class="text-lg text-gray-700">${{ price.priceUSD.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 }) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
