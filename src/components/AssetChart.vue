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

// 顏色配置（根據幣種）
const colorMap: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  ADA: '#0033AD',
  USDT: '#26A17B',
  USDC: '#2775CA'
}

// Chart.js 資料
const chartData = computed(() => {
  const labels = props.assets.map(a => a.symbol)
  const data = props.assets.map(a => a.valueUSD)
  const backgroundColor = props.assets.map(a => colorMap[a.symbol] || '#6B7280')

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
        color: '#D1D5DB',
        padding: 12,
        font: {
          size: 13,
          family: 'system-ui, -apple-system, sans-serif'
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
                index: i
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
