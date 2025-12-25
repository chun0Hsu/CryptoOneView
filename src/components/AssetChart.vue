<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions
} from 'chart.js'
import type { AssetSummary } from '@/stores/useAssetStore'

// 註冊 Chart.js 組件
ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  assets: AssetSummary[]
}>()

// 🔥 擴充顏色配置（支援更多幣種）
const colorMap: Record<string, string> = {
  'BTC': '#F7931A',    // 橙色
  'ETH': '#627EEA',    // 藍色
  'USDT': '#26A17B',   // 綠色
  'USDC': '#2775CA',   // 藍色
  'BNB': '#F3BA2F',    // 黃色
  'ADA': '#0033AD',    // 深藍
  'ASTER': '#E4007F',  // 桃紅 (Astar)
  'USD1': '#27AE60',   // 綠色
}

// 🔥 動態顏色生成器（當 colorMap 沒有定義時）
function generateColor(symbol: string, index: number): string {
  // 如果已定義顏色，直接返回
  if (colorMap[symbol]) {
    return colorMap[symbol]
  }

  // 預定義的漂亮顏色池（16 種）
  const colorPalette = [
    '#FF6384', // 粉紅
    '#36A2EB', // 藍色
    '#FFCE56', // 黃色
    '#4BC0C0', // 青色
    '#9966FF', // 紫色
    '#FF9F40', // 橙色
    '#FF6384', // 粉紅
    '#C9CBCF', // 灰色
    '#4BC0C0', // 青色
    '#FF6384', // 粉紅
    '#36A2EB', // 藍色
    '#FFCE56', // 黃色
    '#E7E9ED', // 淺灰
    '#71B37C', // 綠色
    '#EC6B56', // 紅色
    '#FFC154', // 金色
  ]

  // 使用 index 或根據幣種名稱生成顏色
  return colorPalette[index % colorPalette.length]
}

// Chart.js 資料
const chartData = computed(() => {
  const labels = props.assets.map(a => a.symbol)
  const data = props.assets.map(a => a.valueUSD)

  // 🔥 動態生成顏色
  const backgroundColor = props.assets.map((asset, index) =>
    generateColor(asset.symbol, index)
  )

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor,
        borderColor: '#1F2937',
        borderWidth: 2,
        hoverOffset: 8
      }
    ]
  }
})

// Chart.js 配置
const chartOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        color: '#F3F4F6',
        padding: 12,
        font: {
          size: 13,
          family: 'system-ui, -apple-system, sans-serif',
          weight: '500'
        },
        generateLabels: (chart) => {
          const data = chart.data
          if (data.labels && data.datasets.length) {
            return data.labels.map((label, i) => {
              const dataset = data.datasets[0]
              const value = dataset.data[i] as number
              const total = (dataset.data as number[]).reduce((a, b) => a + b, 0)
              const percentage = ((value / total) * 100).toFixed(1)

              return {
                text: `${label} (${percentage}%)`,
                fillStyle: dataset.backgroundColor?.[i] as string,
                hidden: false,
                index: i,
                fontColor: '#F3F4F6'
              }
            })
          }
          return []
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#F3F4F6',
      bodyColor: '#D1D5DB',
      borderColor: '#374151',
      borderWidth: 1,
      padding: 12,
      displayColors: true,
      callbacks: {
        label: (context) => {
          const label = context.label || ''
          const value = context.parsed
          const total = context.dataset.data.reduce((a: number, b: any) => a + Number(b), 0)
          const percentage = ((value / total) * 100).toFixed(2)
          return `${label}: $${value.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${percentage}%)`
        }
      }
    }
  },
  cutout: '65%'
}
</script>

<template>
  <div class="relative">
    <div v-if="assets.length === 0" class="flex items-center justify-center h-64 text-gray-500">
      <div class="text-center">
        <p class="text-lg mb-2">📊</p>
        <p class="text-sm">尚無資產資料</p>
        <p class="text-xs text-gray-600 mt-1">請先新增 API Key 或錢包地址</p>
      </div>
    </div>

    <div v-else class="h-64">
      <Doughnut :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
