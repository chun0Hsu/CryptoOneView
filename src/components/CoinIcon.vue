<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CryptoSymbol } from '@/types'

const props = defineProps<{
  symbol: CryptoSymbol
  size?: 'sm' | 'md' | 'lg'
}>()

// CoinGecko Coin ID 對應
const coinIdMap: Record<CryptoSymbol, { id: string; image: string }> = {
  BTC: {
    id: 'bitcoin',
    image: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png'
  },
  ETH: {
    id: 'ethereum',
    image: 'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png'
  },
  ADA: {
    id: 'cardano',
    image: 'https://coin-images.coingecko.com/coins/images/975/large/cardano.png'
  },
  USDT: {
    id: 'tether',
    image: 'https://coin-images.coingecko.com/coins/images/325/large/Tether.png'
  },
  USDC: {
    id: 'usd-coin',
    image: 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png'
  }
}

// 尺寸對應
const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12'
}

const sizeClass = computed(() => sizeMap[props.size || 'md'])
const iconUrl = computed(() => coinIdMap[props.symbol].image)
const imageLoaded = ref(false)
const imageError = ref(false)

// 備用顏色（如果圖片載入失敗）
const fallbackColorMap: Record<CryptoSymbol, string> = {
  BTC: 'from-orange-500 to-orange-600',
  ETH: 'from-blue-500 to-blue-600',
  ADA: 'from-blue-600 to-blue-700',
  USDT: 'from-green-500 to-green-600',
  USDC: 'from-blue-500 to-cyan-500'
}

const fallbackColor = computed(() => fallbackColorMap[props.symbol])

function handleImageLoad() {
  imageLoaded.value = true
}

function handleImageError() {
  imageError.value = true
}
</script>

<template>
  <div :class="[sizeClass, 'relative rounded-full overflow-hidden flex-shrink-0 bg-gray-700']">
    <!-- 圖片 -->
    <img v-if="!imageError" :src="iconUrl" :alt="symbol" class="w-full h-full object-cover"
      :class="{ 'opacity-0': !imageLoaded }" @load="handleImageLoad" @error="handleImageError" loading="lazy" />
    <!-- 備用顯示 -->
    <div v-if="!imageLoaded || imageError"
      :class="['absolute inset-0 bg-gradient-to-br flex items-center justify-center text-white font-bold', fallbackColor]">
      {{ symbol.slice(0, 1) }}
    </div>
  </div>
</template>

