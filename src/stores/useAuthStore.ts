import { defineStore } from 'pinia'
import { ref } from 'vue'
import CryptoJS from 'crypto-js'

export const useAuthStore = defineStore('auth', () => {
  // 狀態
  const isUnlocked = ref(false)
  const passwordHash = ref<string | null>(null)
  const sessionPassword = ref<string | null>(null)

  // Session 超時相關
  const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 分鐘（毫秒）
  let timeoutId: number | null = null

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

  // 重置超時計時器
  function resetTimeout() {
    // 清除舊的計時器
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    // 設定新的計時器
    if (isUnlocked.value) {
      timeoutId = window.setTimeout(() => {
        lock()
        console.log('Session timeout: Auto-locked after 30 minutes of inactivity')
      }, SESSION_TIMEOUT)
    }
  }

  // 驗證並解鎖
  function unlock(password: string): boolean {
    const hash = CryptoJS.SHA256(password).toString()
    if (hash === passwordHash.value) {
      isUnlocked.value = true
      sessionPassword.value = password
      resetTimeout() // 開始計時
      return true
    }
    return false
  }

  // 鎖定（清空 session）
  function lock() {
    isUnlocked.value = false
    sessionPassword.value = null

    // 清除計時器
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  // 記錄使用者活動（重置計時器）
  function recordActivity() {
    if (isUnlocked.value) {
      resetTimeout()
    }
  }

  return {
    isUnlocked,
    passwordHash,
    sessionPassword,
    init,
    setPassword,
    unlock,
    lock,
    recordActivity
  }
})
