import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

interface RequestBody {
  apiKey: string
  secret: string
}

interface EarnBalance {
  symbol: string
  amount: number
  type: 'flexible' | 'locked'
}

// 建立簽名
function createSignature(queryString: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(queryString).digest('hex')
}

// 呼叫 Binance API
async function callBinanceAPI(
  endpoint: string,
  params: Record<string, any>,
  apiKey: string,
  secret: string
): Promise<any> {
  const timestamp = Date.now()
  const queryString = new URLSearchParams({
    ...params,
    timestamp: timestamp.toString()
  }).toString()

  const signature = createSignature(queryString, secret)
  const url = `https://api.binance.com${endpoint}?${queryString}&signature=${signature}`

  const response = await fetch(url, {
    headers: { 'X-MBX-APIKEY': apiKey }
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return response.json()
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { apiKey, secret } = req.body as RequestBody

    if (!apiKey || !secret) {
      return res.status(400).json({ error: 'Missing apiKey or secret' })
    }

    const balances: EarnBalance[] = []

    // 🔥 1. 查詢活期理財 (Flexible)
    try {
      const flexibleData = await callBinanceAPI(
        '/sapi/v1/simple-earn/flexible/position',
        { size: 100 },  // 最多 100 筆
        apiKey,
        secret
      )

      if (flexibleData.rows && Array.isArray(flexibleData.rows)) {
        for (const item of flexibleData.rows) {
          const amount = parseFloat(item.totalAmount || '0')
          if (amount > 0) {
            balances.push({
              symbol: item.asset,
              amount,
              type: 'flexible'
            })
          }
        }
      }
    } catch (e: any) {
      console.warn('Binance Flexible Earn failed:', e.message)
    }

    // 🔥 2. 查詢定期理財 (Locked)
    try {
      const lockedData = await callBinanceAPI(
        '/sapi/v1/simple-earn/locked/position',
        { size: 100 },
        apiKey,
        secret
      )

      if (lockedData.rows && Array.isArray(lockedData.rows)) {
        for (const item of lockedData.rows) {
          const amount = parseFloat(item.amount || '0')
          if (amount > 0) {
            balances.push({
              symbol: item.asset,
              amount,
              type: 'locked'
            })
          }
        }
      }
    } catch (e: any) {
      console.warn('Binance Locked Earn failed:', e.message)
    }

    // 即使查詢失敗也返回成功（但 balances 可能為空）
    return res.status(200).json({ balances })

  } catch (error: any) {
    console.error('Binance Earn function error:', error)
    // Earn 查詢失敗不應該影響主要功能，返回空結果
    return res.status(200).json({ balances: [] })
  }
}
