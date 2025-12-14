<script setup lang="ts">
import { ref, watch } from 'vue'

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

const props = defineProps<{
  messages: ToastMessage[]
}>()

const emit = defineEmits<{
  remove: [id: number]
}>()

// 自動移除（3秒後）
watch(() => props.messages, (newMessages) => {
  newMessages.forEach(msg => {
    setTimeout(() => {
      emit('remove', msg.id)
    }, 3000)
  })
}, { deep: true })

// 圖示對應
const iconMap = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️'
}

// 顏色對應
const colorMap = {
  success: 'bg-green-600/90 border-green-500/50',
  error: 'bg-red-600/90 border-red-500/50',
  info: 'bg-blue-600/90 border-blue-500/50',
  warning: 'bg-yellow-600/90 border-yellow-500/50'
}
</script>

<template>
  <div class="fixed top-4 right-4 z-[100] space-y-2">
    <TransitionGroup name="toast">
      <div v-for="msg in messages" :key="msg.id" :class="[
        'min-w-[300px] max-w-md p-4 rounded-lg shadow-2xl border backdrop-blur-sm',
        colorMap[msg.type]
      ]">
        <div class="flex items-start space-x-3">
          <span class="text-xl">{{ iconMap[msg.type] }}</span>
          <div class="flex-1">
            <p class="text-sm text-white font-medium">{{ msg.message }}</p>
          </div>
          <button @click="emit('remove', msg.id)" class="text-white/70 hover:text-white transition">
            ✕
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
