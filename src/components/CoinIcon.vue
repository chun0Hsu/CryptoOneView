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

// 🔥 擴充常見幣種的固定 URL（確保穩定性）
const knownCoins: Record<string, string> = {
  // V1 原有（已驗證可用）
  'BTC': 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png',
  'ETH': 'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png',
  'ADA': 'https://coin-images.coingecko.com/coins/images/975/large/cardano.png',
  'USDT': 'https://coin-images.coingecko.com/coins/images/325/large/Tether.png',
  'USDC': 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png',
  'BNB': 'https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',

  // V2 新增
  'ASTER': 'https://s2.coinmarketcap.com/static/img/coins/64x64/36341.png',
  'USD1': 'https://s2.coinmarketcap.com/static/img/coins/64x64/36148.png',

  // 🔥 常見幣種補充（CoinGecko）
  'XRP': 'https://coin-images.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  'SOL': 'https://coin-images.coingecko.com/coins/images/4128/large/solana.png',
  'DOGE': 'https://coin-images.coingecko.com/coins/images/5/large/dogecoin.png',
  'DOT': 'https://coin-images.coingecko.com/coins/images/12171/large/polkadot.png',
  'MATIC': 'https://coin-images.coingecko.com/coins/images/4713/large/matic-token-icon.png',
  'SHIB': 'https://coin-images.coingecko.com/coins/images/11939/large/shiba.png',
  'AVAX': 'https://coin-images.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
  'LINK': 'https://coin-images.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
  'UNI': 'https://coin-images.coingecko.com/coins/images/12504/large/uni.jpg',
  'LTC': 'https://coin-images.coingecko.com/coins/images/2/large/litecoin.png',
  'ATOM': 'https://coin-images.coingecko.com/coins/images/1481/large/cosmos_hub.png',
  'TRX': 'https://coin-images.coingecko.com/coins/images/1094/large/tron-logo.png',
  'XLM': 'https://coin-images.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png',
  'ETC': 'https://coin-images.coingecko.com/coins/images/453/large/ethereum-classic-logo.png',
  'BCH': 'https://coin-images.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png',
  'FIL': 'https://coin-images.coingecko.com/coins/images/12817/large/filecoin.png',
  'NEAR': 'https://coin-images.coingecko.com/coins/images/10365/large/near.jpg',
  'APT': 'https://coin-images.coingecko.com/coins/images/26455/large/aptos_round.png',
  'ARB': 'https://coin-images.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg',
  'OP': 'https://coin-images.coingecko.com/coins/images/25244/large/Optimism.png',
  'PEPE': 'https://coin-images.coingecko.com/coins/images/29850/large/pepe-token.jpeg',
  'WLD': 'https://coin-images.coingecko.com/coins/images/31069/large/worldcoin.jpeg',
  'SUI': 'https://coin-images.coingecko.com/coins/images/26375/large/sui_asset.jpeg',
  'STX': 'https://coin-images.coingecko.com/coins/images/2069/large/Stacks_logo_full.png',
  'INJ': 'https://coin-images.coingecko.com/coins/images/12882/large/Secondary_Symbol.png',
  'SEI': 'https://coin-images.coingecko.com/coins/images/28205/large/Sei_Logo_-_Transparent.png',
  'TIA': 'https://coin-images.coingecko.com/coins/images/31967/large/tia.jpg',
  'ASTR': 'https://coin-images.coingecko.com/coins/images/22617/large/astr.png',
}

// 🔥 動態生成可能的圖片 URL（按優先級嘗試）
function generateImageUrls(symbol: string): string[] {
  const symbolLower = symbol.toLowerCase()

  return [
    // 1. 如果有固定 URL，優先使用
    knownCoins[symbol],

    // 2. 嘗試 CoinGecko（最常用格式）
    `https://coin-images.coingecko.com/coins/images/${getCoinGeckoId(symbol)}/large/${symbolLower}.png`,

    // 3. 嘗試 CoinMarketCap（需要 UCID，這裡用猜測）
    // 實際使用時可能需要查詢 API

  ].filter(url => url)  // 過濾掉 undefined
}

// 🔥 根據 symbol 猜測 CoinGecko image ID（常見幣種）
function getCoinGeckoId(symbol: string): number {
  const idMap: Record<string, number> = {
    'BTC': 1,
    'ETH': 279,
    'USDT': 325,
    'USDC': 6319,
    'BNB': 825,
    'XRP': 44,
    'SOL': 4128,
    'DOGE': 5,
    'ADA': 975,
    'DOT': 12171,
    'MATIC': 4713,
    'SHIB': 11939,
    'AVAX': 12559,
    'LINK': 877,
    'UNI': 12504,
    'LTC': 2,
    'ATOM': 1481,
    'TRX': 1094,
    'XLM': 100,
    'ETC': 453,
    'BCH': 780,
    'FIL': 12817,
    'NEAR': 10365,
    'APT': 26455,
    'ARB': 16547,
    'OP': 25244,
  }

  return idMap[symbol] || 999999  // 返回一個不存在的 ID（會 404）
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
  'XRP': 'from-slate-600 to-slate-700',  // XRP 官方色
  'SOL': 'from-purple-600 to-violet-600',
  'DOGE': 'from-yellow-600 to-amber-600',
  'DOT': 'from-pink-500 to-rose-500',
  'MATIC': 'from-purple-700 to-indigo-700',
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
    console.log(`[CoinIcon] ${props.symbol} - 嘗試備用圖片 (${currentUrlIndex.value + 1}/${imageUrls.value.length})`)
  } else {
    // 所有 URL 都失敗，顯示文字備用
    imageError.value = true
    console.warn(`[CoinIcon] ${props.symbol} - 所有圖片來源都失敗，使用文字備用`)
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
      :class="['absolute inset-0 bg-gradient-to-br flex items-center justify-center text-white font-bold', fallbackColor]"
      :style="{ fontSize: size === 'sm' ? '10px' : size === 'lg' ? '16px' : '12px' }">
      {{ symbol.slice(0, 2) }}
    </div>
  </div>
</template>
