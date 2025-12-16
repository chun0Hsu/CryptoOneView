import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './useAuthStore'
import CryptoJS from 'crypto-js'

// 錢包地址資料結構
export interface WalletAddress {
  id: string
  source: 'binance_hot' | 'okx_hot' | 'ledger_cold'
  chain: 'BTC' | 'ETH' | 'ADA'
  address: string
  label?: string
  encryptedApiKey?: string  
  createdAt: number
}

export const useWalletStore = defineStore('wallet', () => {
  const authStore = useAuthStore()

  // 狀態：所有錢包地址
  const addresses = ref<WalletAddress[]>([])

  // Getter：依來源分類
  const addressesBySource = computed(() => {
    return {
      binance_hot: addresses.value.filter(a => a.source === 'binance_hot'),
      okx_hot: addresses.value.filter(a => a.source === 'okx_hot'),
      ledger_cold: addresses.value.filter(a => a.source === 'ledger_cold')
    }
  })

  // Getter：依鏈分類
  const addressesByChain = computed(() => {
    return {
      BTC: addresses.value.filter(a => a.chain === 'BTC'),
      ETH: addresses.value.filter(a => a.chain === 'ETH'),
      ADA: addresses.value.filter(a => a.chain === 'ADA')
    }
  })

  // 初始化：從 localStorage 讀取
  function init() {
    const stored = localStorage.getItem('cryptooneview_wallet_addresses')
    if (stored) {
      try {
        addresses.value = JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse wallet addresses:', e)
        addresses.value = []
      }
    }
  }

  // 儲存到 localStorage
  function save() {
    localStorage.setItem('cryptooneview_wallet_addresses', JSON.stringify(addresses.value))
  }

  // 新增錢包地址
  function addAddress(
    source: 'binance_hot' | 'okx_hot' | 'ledger_cold',
    chain: 'BTC' | 'ETH' | 'ADA',
    address: string,
    label?: string,
    apiKey?: string
  ) {
    // 檢查系統是否已解鎖
    if (apiKey && !authStore.sessionPassword) {
      throw new Error('系統未解鎖，無法加密 API Key')
    }

    // 檢查是否已存在（同一個地址在同一個來源）
    const exists = addresses.value.some(
      a => a.address === address && a.source === source && a.chain === chain
    )
    if (exists) {
      throw new Error('此地址已存在於該來源')
    }

    // 加密 API Key（如果有提供）
    let encryptedApiKey: string | undefined
    if (apiKey && authStore.sessionPassword) {
      encryptedApiKey = CryptoJS.AES.encrypt(
        apiKey,
        authStore.sessionPassword
      ).toString()
    }

    addresses.value.push({
      id: `${source}_${chain}_${Date.now()}`,
      source,
      chain,
      address,
      label,
      encryptedApiKey,  // ← 存加密後的
      createdAt: Date.now()
    })

    save()
  }

  // 解密並取得 API Key
  function getApiKey(id: string): string | null {
    if (!authStore.sessionPassword) {
      return null
    }

    const addr = addresses.value.find(a => a.id === id)
    if (!addr || !addr.encryptedApiKey) {
      return null
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(
        addr.encryptedApiKey,
        authStore.sessionPassword
      ).toString(CryptoJS.enc.Utf8)

      return decrypted || null
    } catch (e) {
      console.error('解密 API Key 失敗:', e)
      return null
    }
  }

  // 更新標籤
  function updateLabel(id: string, label: string) {
    const addr = addresses.value.find(a => a.id === id)
    if (addr) {
      addr.label = label
      save()
    }
  }

  // 刪除地址
  function removeAddress(id: string) {
    addresses.value = addresses.value.filter(a => a.id !== id)
    save()
  }

  // 清空所有地址
  function clearAll() {
    addresses.value = []
    save()
  }

  return {
    addresses,
    addressesBySource,
    addressesByChain,
    init,
    addAddress,
    getApiKey,  
    updateLabel,
    removeAddress,
    clearAll
  }
})
