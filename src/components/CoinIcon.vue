<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CryptoSymbol } from '@/types'

const props = defineProps<{
  symbol: CryptoSymbol
  size?: 'sm' | 'md' | 'lg'
}>()

// 尺寸對應
const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12'
}

const sizeClass = computed(() => sizeMap[props.size || 'md'])

// 🔥 常見幣種的固定 URL（確保穩定性）
const knownCoins: Record<string, string> = {
  'BTC': 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png',
  'ETH': 'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png',
  'ADA': 'https://coin-images.coingecko.com/coins/images/975/large/cardano.png',
  'USDT': 'https://coin-images.coingecko.com/coins/images/325/large/Tether.png',
  'USDC': 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png',
  'BNB': 'https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  'ASTER': 'https://s2.coinmarketcap.com/static/img/coins/64x64/36341.png',
  'USD1': 'https://s2.coinmarketcap.com/static/img/coins/64x64/36148.png',
}

// 🔥 動態生成可能的圖片 URL（按優先級嘗試）
function generateImageUrls(symbol: string): string[] {
  const symbolLower = symbol.toLowerCase()

  return [
    // 1. 如果有固定 URL，優先使用
    knownCoins[symbol],

    // 2. 嘗試 Binance CDN（常用於主流幣種）
    `https://bin.bnbstatic.com/image/admin_mgs_image_upload/20220218/94b2c01f-70b0-42ab-a314-3e5e91113b66.png`,

    // 3. 嘗試 CryptoCompare CDN（格式：symbol 小寫）
    `https://www.cryptocompare.com/media/37746251/${symbolLower}.png`,

    // 4. 嘗試另一個 CryptoCompare 路徑
    `https://www.cryptocompare.com/media/37746251/${symbol}.png`,

  ].filter(url => url)  // 過濾掉 undefined
}

const imageUrls = computed(() => generateImageUrls(props.symbol))
const currentUrlIndex = ref(0)
const imageLoaded = ref(false)
const imageError = ref(false)

// 當前嘗試的 URL
const iconUrl = computed(() => imageUrls.value[currentUrlIndex.value])

// 備用顏色
const fallbackColorMap: Record<string, string> = {
  'BTC': 'from-orange-500 to-orange-600',
  'ETH': 'from-blue-500 to-blue-600',
  'ADA': 'from-blue-600 to-blue-700',
  'USDT': 'from-green-500 to-green-600',
  'USDC': 'from-blue-500 to-cyan-500',
  'BNB': 'from-yellow-500 to-yellow-600',
  'ASTER': 'from-purple-500 to-purple-600',
  'USD1': 'from-blue-400 to-blue-500',
}

const fallbackColor = computed(() => {
  if (fallbackColorMap[props.symbol]) {
    return fallbackColorMap[props.symbol]
  }

  const colors = [
    'from-red-500 to-red-600',
    'from-orange-500 to-orange-600',
    'from-amber-500 to-amber-600',
    'from-yellow-500 to-yellow-600',
    'from-lime-500 to-lime-600',
    'from-green-500 to-green-600',
    'from-emerald-500 to-emerald-600',
    'from-teal-500 to-teal-600',
    'from-cyan-500 to-cyan-600',
    'from-sky-500 to-sky-600',
    'from-blue-500 to-blue-600',
    'from-indigo-500 to-indigo-600',
    'from-violet-500 to-violet-600',
    'from-purple-500 to-purple-600',
    'from-fuchsia-500 to-fuchsia-600',
    'from-pink-500 to-pink-600',
  ]

  const index = props.symbol.charCodeAt(0) % colors.length
  return colors[index]
})

function handleImageLoad() {
  imageLoaded.value = true
  imageError.value = false
}

// 🔥 智能錯誤處理：嘗試下一個 URL
function handleImageError() {
  // 如果還有其他 URL 可以嘗試
  if (currentUrlIndex.value < imageUrls.value.length - 1) {
    currentUrlIndex.value++
    console.log(`嘗試載入 ${props.symbol} 的備用圖片 (${currentUrlIndex.value + 1}/${imageUrls.value.length})`)
  } else {
    // 所有 URL 都失敗，顯示文字備用
    imageError.value = true
    console.warn(`所有圖片來源都失敗: ${props.symbol}，使用文字備用`)
  }
}
</script>

<template>
  <div :class="[sizeClass, 'relative rounded-full overflow-hidden flex-shrink-0 bg-gray-700']">
    <!-- 圖片 -->
    <img v-if="iconUrl && !imageError" :key="iconUrl" :src="iconUrl" :alt="symbol" class="w-full h-full object-cover"
      :class="{ 'opacity-0': !imageLoaded }" @load="handleImageLoad" @error="handleImageError" loading="lazy" />

    <!-- 備用顯示（文字） -->
    <div v-if="!iconUrl || !imageLoaded || imageError"
      :class="['absolute inset-0 bg-gradient-to-br flex items-center justify-center text-white font-bold', fallbackColor]">
      {{ symbol.slice(0, 2) }}
    </div>
  </div>
</template>
