<script setup lang="ts">
defineProps<{
  show: boolean
  message?: string
}>()
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700 max-w-sm w-full mx-4">

        <!-- Loading Spinner -->
        <div class="flex justify-center mb-6">
          <div class="relative">
            <div class="w-16 h-16 border-4 border-gray-700 rounded-full"></div>
            <div
              class="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0">
            </div>
          </div>
        </div>

        <!-- Message -->
        <p class="text-center text-white font-semibold text-lg mb-2">
          {{ message || '查詢中...' }}
        </p>
        <p class="text-center text-gray-400 text-sm">
          請稍候，正在從各平台獲取資料
        </p>

        <!-- Progress Dots -->
        <div class="flex justify-center space-x-2 mt-6">
          <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0s"></div>
          <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

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
