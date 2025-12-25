<script setup lang="ts">
defineProps<{
  show: boolean
  message?: string
}>()
</script>

<template>
  <!-- Loading Overlay -->
  <Transition name="fade">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">

      <!-- 背景裝飾 -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          class="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 rounded-full blur-3xl animate-pulse-slow">
        </div>
        <div
          class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tr from-blue-500/10 to-purple-500/5 rounded-full blur-3xl animate-pulse-slow"
          style="animation-delay: 1s;"></div>
      </div>

      <!-- Loading Card -->
      <div
        class="relative z-10 bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-slate-700/50 max-w-sm w-full mx-4">

        <!-- Spinner -->
        <div class="flex justify-center mb-6">
          <div class="relative w-20 h-20">
            <!-- 外圈 -->
            <div class="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
            <!-- 旋轉圈 -->
            <div
              class="absolute inset-0 border-4 border-transparent border-t-indigo-500 border-r-violet-500 rounded-full animate-spin">
            </div>
            <!-- 內圈發光 -->
            <div class="absolute inset-2 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-full blur-md">
            </div>
            <!-- 中心點 -->
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-3 h-3 bg-gradient-to-br from-indigo-400 to-violet-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        <!-- Message -->
        <div class="text-center space-y-2">
          <p class="text-lg font-semibold bg-gradient-to-r from-indigo-200 to-violet-200 bg-clip-text text-transparent">
            {{ message || '載入中...' }}
          </p>
          <div class="flex justify-center gap-1">
            <span class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 0s;"></span>
            <span class="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style="animation-delay: 0.2s;"></span>
            <span class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 0.4s;"></span>
          </div>
        </div>

        <!-- Progress hint -->
        <div class="mt-6 text-center">
          <p class="text-xs text-slate-500">請稍候，系統正在處理您的請求</p>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Spin Animation */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1.5s linear infinite;
}

/* Slow Pulse Animation */
@keyframes pulse-slow {

  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }

  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

.animate-pulse-slow {
  animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Bounce Animation */
@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}
</style>
