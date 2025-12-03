import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import CryptoJS from 'crypto-js'
import type { EncryptedCredential, ExchangeName } from '@/types'
import { useAuthStore } from './useAuthStore'

export const useCredentialStore = defineStore('credential', () => {
  const authStore = useAuthStore()

  // 狀態：加密的憑證列表
  const credentials = ref<EncryptedCredential[]>([])

  // Getter：檢查某個交易所是否已設定
  const hasCredential = computed(() => (exchange: ExchangeName) => {
    return credentials.value.some(c => c.exchange === exchange)
  })

  // 初始化：從 localStorage 讀取
  function init() {
    const stored = localStorage.getItem('cryptooneview_credentials')
    if (stored) {
      try {
        credentials.value = JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse credentials:', e)
        credentials.value = []
      }
    }
  }

  // 儲存到 localStorage
  function save() {
    localStorage.setItem('cryptooneview_credentials', JSON.stringify(credentials.value))
  }

  // 新增或更新憑證
  function setCredential(exchange: ExchangeName, apiKey: string, secret: string) {
    if (!authStore.sessionPassword) {
      throw new Error('系統未解鎖，無法加密憑證')
    }

    // 使用 session password 加密
    const encryptedApiKey = CryptoJS.AES.encrypt(apiKey, authStore.sessionPassword).toString()
    const encryptedSecret = CryptoJS.AES.encrypt(secret, authStore.sessionPassword).toString()

    // 移除舊的（如果存在）
    credentials.value = credentials.value.filter(c => c.exchange !== exchange)

    // 新增
    credentials.value.push({
      id: `${exchange}_${Date.now()}`,
      exchange,
      encryptedApiKey,
      encryptedSecret,
      createdAt: Date.now()
    })

    save()
  }

  // 解密並取得憑證
  function getCredential(exchange: ExchangeName): { apiKey: string; secret: string } | null {
    if (!authStore.sessionPassword) {
      throw new Error('系統未解鎖，無法解密憑證')
    }

    const cred = credentials.value.find(c => c.exchange === exchange)
    if (!cred) return null

    try {
      const apiKey = CryptoJS.AES.decrypt(cred.encryptedApiKey, authStore.sessionPassword).toString(CryptoJS.enc.Utf8)
      const secret = CryptoJS.AES.decrypt(cred.encryptedSecret, authStore.sessionPassword).toString(CryptoJS.enc.Utf8)
      return { apiKey, secret }
    } catch (e) {
      console.error('Failed to decrypt credential:', e)
      return null
    }
  }

  // 刪除憑證
  function removeCredential(exchange: ExchangeName) {
    credentials.value = credentials.value.filter(c => c.exchange !== exchange)
    save()
  }

  // 清空所有憑證
  function clearAll() {
    credentials.value = []
    save()
  }

  return {
    credentials,
    hasCredential,
    init,
    setCredential,
    getCredential,
    removeCredential,
    clearAll
  }
})
