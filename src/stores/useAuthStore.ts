import { defineStore } from 'pinia'
import { ref } from 'vue'
import CryptoJS from 'crypto-js'

export const useAuthStore = defineStore('auth', () => {
  // 狀態
  const isUnlocked = ref(false)           // 是否已解鎖
  const passwordHash = ref<string | null>(null)  // 密碼 hash（從 localStorage 讀取）
  const sessionPassword = ref<string | null>(null)  // 當前 session 的密碼（僅存在記憶體）

  // 初始化：從 localStorage 讀取密碼 hash
  function init() {
    const stored = localStorage.getItem('cryptooneview_password_hash')
    if (stored) {
      passwordHash.value = stored
    }
  }

  // 設定新密碼（首次使用）
  function setPassword(password: string) {
    const hash = CryptoJS.SHA256(password).toString()
    passwordHash.value = hash
    localStorage.setItem('cryptooneview_password_hash', hash)
  }

  // 驗證並解鎖
  function unlock(password: string): boolean {
    const hash = CryptoJS.SHA256(password).toString()
    if (hash === passwordHash.value) {
      isUnlocked.value = true
      sessionPassword.value = password  // 存在記憶體中，用於解密 API Key
      return true
    }
    return false
  }

  // 鎖定（清空 session）
  function lock() {
    isUnlocked.value = false
    sessionPassword.value = null
  }

  return {
    isUnlocked,
    passwordHash,
    sessionPassword,
    init,
    setPassword,
    unlock,
    lock
  }
})
