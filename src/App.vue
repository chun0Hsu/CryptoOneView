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
    // 密碼錯誤後重新 focus
    nextTick(() => {
      passwordInputRef.value?.focus()
    })
  }
}

// 監聽解鎖狀態變化，自動 focus
watch(() => authStore.isUnlocked, async (isUnlocked) => {
  if (!isUnlocked) {
    await nextTick()
    passwordInputRef.value?.focus()
  }
})

// 初始載入時 focus
onMounted(async () => {
  authStore.init()
  await nextTick()
  if (!authStore.isUnlocked) {
    passwordInputRef.value?.focus()
  }
})
</script>

<template>
  <!-- 已解鎖：顯示儀表板 -->
  <Dashboard v-if="authStore.isUnlocked" />

  <!-- 未解鎖：顯示登入畫面 -->
  <div v-else class="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">

    <!-- 背景裝飾 -->
    <div class="absolute inset-0 overflow-hidden">
      <div
        class="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 rounded-full blur-3xl">
      </div>
      <div
        class="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tr from-blue-500/10 to-purple-500/5 rounded-full blur-3xl">
      </div>
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-cyan-500/5 to-indigo-500/5 rounded-full blur-3xl">
      </div>
    </div>

    <!-- 登入卡片 -->
    <div
      class="relative z-10 bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-700/50">

      <!-- Logo -->
      <div class="text-center mb-8">
        <div
          class="w-16 h-16 mx-auto bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center mb-4 border border-slate-600/50 shadow-lg shadow-indigo-500/20">
          <span
            class="text-3xl font-bold bg-gradient-to-br from-indigo-200 to-violet-300 bg-clip-text text-transparent">C</span>
        </div>
        <h1 class="text-2xl font-bold bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent mb-1">
          CryptoOneView
        </h1>
        <p class="text-slate-400 text-sm">統一管理您的加密資產</p>
      </div>

      <!-- 首次設定密碼 -->
      <div v-if="!authStore.passwordHash" class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-slate-300 mb-2">設定解鎖密碼</label>
          <input ref="passwordInputRef" v-model="passwordInput" type="password" placeholder="請輸入密碼（至少 6 個字元）"
            @keyup.enter="handleSetPassword" autofocus
            class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition backdrop-blur-sm" />
        </div>

        <button @click="handleSetPassword"
          class="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg border border-slate-600 hover:border-indigo-500/50 hover:shadow-indigo-500/20">
          設定密碼
        </button>

        <div class="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 backdrop-blur-sm">
          <div class="flex items-start space-x-3">
            <span class="text-cyan-400 text-lg">⚠️</span>
            <div class="text-xs text-slate-400 space-y-1">
              <p class="text-slate-300 font-semibold">安全提示</p>
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
          <label class="block text-sm font-semibold text-slate-300 mb-2">解鎖密碼</label>
          <input ref="passwordInputRef" v-model="passwordInput" type="password" placeholder="請輸入密碼"
            @keyup.enter="handleUnlock" autofocus
            class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition backdrop-blur-sm" />
        </div>

        <button @click="handleUnlock"
          class="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg border border-slate-600 hover:border-indigo-500/50 hover:shadow-indigo-500/20 flex items-center justify-center space-x-2">
          <span class="text-indigo-300">🔓</span>
          <span>解鎖</span>
        </button>

        <div class="text-center">
          <p class="text-xs text-slate-500 flex items-center justify-center gap-2">
            <span class="w-1.5 h-1.5 bg-slate-600 rounded-full"></span>
            系統將在 30 分鐘無操作後自動鎖定
          </p>
        </div>
      </div>

      <!-- 錯誤訊息 -->
      <div v-if="errorMessage" class="mt-4 p-3 bg-rose-950/30 border border-rose-800/30 rounded-lg backdrop-blur-sm">
        <p class="text-sm text-rose-300 text-center flex items-center justify-center gap-2">
          <span>❌</span>
          <span>{{ errorMessage }}</span>
        </p>
      </div>

      <!-- Footer -->
      <div class="mt-8 pt-6 border-t border-slate-700/50 text-center">
        <p class="text-xs text-slate-500 flex items-center justify-center gap-2">
          <span class="text-cyan-400">🔒</span>
          All data stored locally in your browser
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* 呼吸燈動畫 */
@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
