<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useAuthStore } from './stores/useAuthStore'
import Dashboard from './components/Dashboard.vue'

const authStore = useAuthStore()
const passwordInput = ref('')
const errorMessage = ref('')
const passwordInputRef = ref<HTMLInputElement | null>(null)

// 首次設定密碼
function handleSetPassword() {
  if (passwordInput.value.length < 6) {
    errorMessage.value = '密碼至少需要 6 個字元'
    return
  }
  authStore.setPassword(passwordInput.value)
  passwordInput.value = ''
  errorMessage.value = ''
}

// 解鎖
function handleUnlock() {
  const success = authStore.unlock(passwordInput.value)
  if (success) {
    errorMessage.value = ''
    passwordInput.value = ''
  } else {
    errorMessage.value = '密碼錯誤'
    passwordInput.value = ''
  }
}

// 自動 focus 到密碼輸入框
watch(() => authStore.isUnlocked, async (isUnlocked) => {
  if (!isUnlocked) {
    await nextTick()
    passwordInputRef.value?.focus()
  }
})

// 初始載入時也 focus
onMounted(() => {
  if (!authStore.isUnlocked) {
    passwordInputRef.value?.focus()
  }
})
</script>

<template>
  <!-- 已解鎖：顯示儀表板 -->
  <Dashboard v-if="authStore.isUnlocked" />

  <!-- 未解鎖：顯示登入畫面 -->
  <div v-else class="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div class="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-700">

      <!-- Logo -->
      <div class="text-center mb-8">
        <div
          class="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
          <span class="text-3xl font-bold text-white">C</span>
        </div>
        <h1 class="text-2xl font-bold text-white mb-1">CryptoOneView</h1>
        <p class="text-gray-400 text-sm">統一管理您的加密資產</p>
      </div>

      <!-- 首次設定密碼 -->
      <div v-if="!authStore.passwordHash" class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-300 mb-2">設定解鎖密碼</label>
          <input ref="passwordInputRef" v-model="passwordInput" type="password" placeholder="請輸入密碼（至少 6 個字元）"
            @keyup.enter="handleSetPassword"
            class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
        </div>

        <button @click="handleSetPassword"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition shadow-lg">
          設定密碼
        </button>

        <div class="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <div class="flex items-start space-x-3">
            <span class="text-yellow-500 text-lg">⚠️</span>
            <div class="text-xs text-gray-400 space-y-1">
              <p>• 密碼將用於加密您的 API Keys</p>
              <p>• 所有資料儲存在本地，請妥善保管密碼</p>
              <p>• 密碼遺失將無法復原，需重新設定</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 解鎖介面 -->
      <div v-else class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-300 mb-2">解鎖密碼</label>
          <input ref="passwordInputRef" v-model="passwordInput" type="password" placeholder="請輸入密碼"
            @keyup.enter="handleUnlock"
            class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
        </div>

        <button @click="handleUnlock"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition shadow-lg flex items-center justify-center space-x-2">
          <span>🔓</span>
          <span>解鎖</span>
        </button>

        <div class="text-center">
          <p class="text-xs text-gray-500">
            系統將在 30 分鐘無操作後自動鎖定
          </p>
        </div>
      </div>

      <!-- 錯誤訊息 -->
      <div v-if="errorMessage" class="mt-4 p-3 bg-red-600/20 border border-red-600/30 rounded-lg">
        <p class="text-sm text-red-400 text-center">❌ {{ errorMessage }}</p>
      </div>

      <!-- Footer -->
      <div class="mt-8 pt-6 border-t border-gray-700 text-center">
        <p class="text-xs text-gray-500">
          🔒 All data stored locally in your browser
        </p>
      </div>

    </div>
  </div>
</template>

