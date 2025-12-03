<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from './stores/useAuthStore'

const authStore = useAuthStore()
const passwordInput = ref('')
const message = ref('')

// 設定密碼（首次使用）
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
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <h1 class="text-3xl font-bold text-gray-800 mb-6 text-center">
        CryptoOneView Auth Test
      </h1>

      <!-- 狀態顯示 -->
      <div class="mb-6 p-4 rounded-lg" :class="authStore.isUnlocked ? 'bg-green-100' : 'bg-gray-100'">
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

      <!-- 已解鎖狀態 -->
      <div v-else class="space-y-4">
        <p class="text-green-600 font-semibold text-center">✅ 系統已解鎖</p>
        <button 
          @click="handleLock"
          class="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          鎖定
        </button>
      </div>

      <!-- 訊息顯示 -->
      <p v-if="message" class="mt-4 text-center text-sm font-medium" :class="message.includes('✅') ? 'text-green-600' : 'text-red-600'">
        {{ message }}
      </p>
    </div>
  </div>
</template>
