import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './useAuthStore'
import CryptoJS from 'crypto-js'
import type { ExchangeName } from '@/types'

// 憑證資料結構
interface Credential {
  id: string
  exchange: ExchangeName
  encryptedData: string  // 加密整包資料（包含 apiKey, secret, passphrase）
}

export const useCredentialStore = defineStore('credential', () => {
  const authStore = useAuthStore()

  // 狀態
  const credentials = ref<Credential[]>([])

  // 從 localStorage 載入
  function loadFromStorage() {
    const stored = localStorage.getItem('cryptooneview_credentials')
    if (stored) {
      try {
        credentials.value = JSON.parse(stored)
      } catch (e) {
        console.error('載入憑證失敗:', e)
        credentials.value = []
      }
    }
  }

  // 儲存到 localStorage
  function saveToStorage() {
    localStorage.setItem('cryptooneview_credentials', JSON.stringify(credentials.value))
  }

  // 初始化
  function init() {
    loadFromStorage()
  }

  // 儲存交易所憑證
  function setCredential(
    exchange: ExchangeName,
    apiKey: string,
    secret: string,
    passphrase?: string
  ) {
    if (!authStore.sessionPassword) {
      throw new Error('系統未解鎖')
    }

    // 將所有敏感資料打包成 JSON
    const sensitiveData = {
      apiKey,
      secret,
      ...(passphrase && { passphrase })
    }

    // 加密整包資料
    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify(sensitiveData),
      authStore.sessionPassword
    ).toString()

    // 檢查是否已存在
    const existingIndex = credentials.value.findIndex(c => c.exchange === exchange)

    if (existingIndex >= 0) {
      // 更新現有憑證
      credentials.value[existingIndex].encryptedData = encryptedData
    } else {
      // 新增憑證
      credentials.value.push({
        id: `${exchange}_${Date.now()}`,
        exchange,
        encryptedData
      })
    }

    saveToStorage()
  }

  // 解密並取得憑證
  function getCredential(exchange: ExchangeName): { apiKey: string; secret: string; passphrase?: string } | null {
    if (!authStore.sessionPassword) {
      return null
    }

    const credential = credentials.value.find(c => c.exchange === exchange)
    if (!credential) {
      return null
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(
        credential.encryptedData,
        authStore.sessionPassword
      ).toString(CryptoJS.enc.Utf8)

      return JSON.parse(decrypted)
    } catch (e) {
      console.error('解密失敗:', e)
      return null
    }
  }

  // 移除憑證
  function removeCredential(exchange: ExchangeName) {
    credentials.value = credentials.value.filter(c => c.exchange !== exchange)
    saveToStorage()
  }

  // 清空所有憑證
  function clearAll() {
    credentials.value = []
    saveToStorage()
  }

  return {
    credentials,
    init,
    setCredential,
    getCredential,
    removeCredential,
    clearAll
  }
})
