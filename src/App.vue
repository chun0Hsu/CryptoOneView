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
  <div v-else
    class="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
    <div class="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20">

      <!-- Logo -->
      <div class="text-center mb-8">
        <div
          class="w-20 h-20 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 border border-white/30">
          <span class="text-4xl font-bold text-white">C</span>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">CryptoOneView</h1>
        <p class="text-white/80">您的加密資產儀表板</p>
      </div>

      <!-- 首次設定密碼 -->
      <div v-if="!authStore.passwordHash" class="space-y-6">
        <div>
          <label class="block text-sm font-semibold text-white/90 mb-2">設定解鎖密碼</label>
          <input ref="passwordInputRef" v-model="passwordInput" type="password" placeholder="請輸入密碼（至少 6 個字元）"
            @keyup.enter="handleSetPassword"
            class="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition" />
        </div>

        <button @click="handleSetPassword"
          class="w-full bg-white hover:bg-white/90 text-purple-600 font-bold py-3 px-6 rounded-xl transition shadow-lg">
          設定密碼
        </button>

        <div class="text-center text-xs text-white/70 space-y-1">
          <p>⚠️ 密碼將用於加密您的 API Keys</p>
          <p>請妥善保管，遺失無法復原</p>
        </div>
      </div>

      <!-- 解鎖介面 -->
      <div v-else class="space-y-6">
        <div>
          <label class="block text-sm font-semibold text-white/90 mb-2">輸入密碼解鎖</label>
          <input ref="passwordInputRef" v-model="passwordInput" type="password" placeholder="請輸入密碼"
            @keyup.enter="handleUnlock"
            class="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition" />
        </div>

        <button @click="handleUnlock"
          class="w-full bg-white hover:bg-white/90 text-purple-600 font-bold py-3 px-6 rounded-xl transition shadow-lg">
          🔓 解鎖
        </button>
      </div>

      <!-- 錯誤訊息 -->
      <div v-if="errorMessage" class="mt-4 p-3 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-lg">
        <p class="text-sm text-red-200 text-center">❌ {{ errorMessage }}</p>
      </div>

    </div>
  </div>
</template>
