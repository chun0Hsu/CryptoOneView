import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

export const useToastStore = defineStore('toast', () => {
  const messages = ref<ToastMessage[]>([])
  let nextId = 1

  function show(type: ToastMessage['type'], message: string) {
    const id = nextId++
    messages.value.push({ id, type, message })
  }

  function success(message: string) {
    show('success', message)
  }

  function error(message: string) {
    show('error', message)
  }

  function info(message: string) {
    show('info', message)
  }

  function warning(message: string) {
    show('warning', message)
  }

  function remove(id: number) {
    messages.value = messages.value.filter(m => m.id !== id)
  }

  return {
    messages,
    show,
    success,
    error,
    info,
    warning,
    remove
  }
})
