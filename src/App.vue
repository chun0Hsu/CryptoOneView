<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from './stores/useAuthStore'
import { useCredentialStore } from './stores/useCredentialStore'
import type { ExchangeName } from './types'

const authStore = useAuthStore()
const credentialStore = useCredentialStore()

const passwordInput = ref('')
const message = ref('')

// 新增憑證表單
const selectedExchange = ref<ExchangeName>('binance')
const apiKeyInput = ref('')
const secretInput = ref('')

// 設定密碼
function handleSetPassword() {
  if (passwordInput.value.length < 6) {
    message.value = '❌ 密碼至少需要 6 個字元'
    return
  }
  authStore.setPassword(passwordInput.value)
  message.value = '✅ 密碼設定成功！'
  passwordInput.value = ''
}

// 解鎖
function handleUnlock() {
  const success = authStore.unlock(passwordInput.value)
  if (success) {
    message.value = '✅ 解鎖成功！'
  } else {
    message.value = '❌ 密碼錯誤'
  }
  passwordInput.value = ''
}

// 鎖定
function handleLock() {
  authStore.lock()
  message.value = '🔒 已鎖定'
}

// 新增憑證
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

// 測試解密
function handleTestDecrypt(exchange: ExchangeName) {
  try {
    const cred = credentialStore.getCredential(exchange)
    if (cred) {
      message.value = `✅ 解密成功！API Key: ${cred.apiKey.slice(0, 8)}...`
    } else {
      message.value = '❌ 找不到憑證'
    }
  } catch (e: any) {
    message.value = `❌ ${e.message}`
  }
}

// 刪除憑證
function handleRemove(exchange: ExchangeName) {
  credentialStore.removeCredential(exchange)
  message.value = `🗑️ ${exchange.toUpperCase()} 憑證已刪除`
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
    <div class="max-w-2xl mx-auto py-8 space-y-6">
      
      <!-- 標題 -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">CryptoOneView</h1>
        <p class="text-white/80">憑證管理測試</p>
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
          <input 
            v-model="passwordInput"
            type="password"
            placeholder="輸入密碼（至少6字元）"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            @click="handleSetPassword"
            class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            設定密碼
          </button>
        </div>

        <!-- 解鎖介面 -->
        <div v-else-if="!authStore.isUnlocked" class="space-y-4">
          <input 
            v-model="passwordInput"
            type="password"
            placeholder="輸入密碼解鎖"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            @keyup.enter="handleUnlock"
          />
          <button 
            @click="handleUnlock"
            class="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            解鎖
          </button>
        </div>

        <!-- 已解鎖：鎖定按鈕 -->
        <div v-else>
          <button 
            @click="handleLock"
            class="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            鎖定
          </button>
        </div>
      </div>

      <!-- 新增憑證卡片（僅在解鎖時顯示） -->
      <div v-if="authStore.isUnlocked" class="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
        <h2 class="text-xl font-bold text-gray-800">新增交易所憑證</h2>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">選擇交易所</label>
          <select 
            v-model="selectedExchange"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="binance">Binance</option>
            <option value="okx">OKX</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">API Key</label>
          <input 
            v-model="apiKeyInput"
            type="text"
            placeholder="輸入 API Key"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
          <input 
            v-model="secretInput"
            type="password"
            placeholder="輸入 Secret Key"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button 
          @click="handleAddCredential"
          class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          儲存憑證（AES-256加密）
        </button>
      </div>

      <!-- 已儲存的憑證列表 -->
      <div v-if="authStore.isUnlocked && credentialStore.credentials.length > 0" class="bg-white rounded-2xl shadow-2xl p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">已儲存的憑證</h2>
        <div class="space-y-3">
          <div 
            v-for="cred in credentialStore.credentials" 
            :key="cred.id"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <p class="font-semibold text-gray-800">{{ cred.exchange.toUpperCase() }}</p>
              <p class="text-xs text-gray-500">ID: {{ cred.id }}</p>
            </div>
            <div class="flex gap-2">
              <button 
                @click="handleTestDecrypt(cred.exchange)"
                class="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded transition"
              >
                測試解密
              </button>
              <button 
                @click="handleRemove(cred.exchange)"
                class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 訊息顯示 -->
      <div v-if="message" class="bg-white rounded-lg shadow p-4">
        <p class="text-center font-medium" :class="message.includes('✅') ? 'text-green-600' : message.includes('❌') ? 'text-red-600' : 'text-gray-600'">
          {{ message }}
        </p>
      </div>

    </div>
  </div>
</template>
