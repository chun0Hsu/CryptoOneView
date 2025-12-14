import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

interface RequestBody {
  apiKey: string
  secret: string
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

    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}`
    const signature = crypto
      .createHmac('sha256', secret)
      .update(queryString)
      .digest('hex')

    const url = `https://api.binance.com/sapi/v1/lending/union/account?${queryString}&signature=${signature}`

    const response = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    })

    // 檢查 Content-Type
    const contentType = response.headers.get('content-type')

    if (!response.ok) {
      // 嘗試解析錯誤訊息
      let errorMessage = 'Binance Earn API error'

      if (contentType?.includes('application/json')) {
        try {
          const errorData = await response.json()
          errorMessage = errorData.msg || errorMessage
        } catch {
          // JSON 解析失敗，使用預設錯誤訊息
        }
      } else {
        // 不是 JSON，讀取文字
        const errorText = await response.text()
        errorMessage = errorText.substring(0, 100) // 只取前 100 字元
      }

      // Earn API 失敗不算嚴重錯誤，返回空結果
      console.log(`Binance Earn API failed: ${errorMessage}`)
      return res.status(200).json({ balances: [] })
    }

    // 檢查是否為 JSON
    if (!contentType?.includes('application/json')) {
      console.log('Binance Earn API returned non-JSON response')
      return res.status(200).json({ balances: [] })
    }

    const data = await response.json()

    const supportedSymbols = ['BTC', 'ETH', 'ADA', 'USDT', 'USDC']
    const balances: any[] = []

    for (const item of data.positionAmountVos || []) {
      if (supportedSymbols.includes(item.asset)) {
        const amount = parseFloat(item.amount || '0')
        if (amount > 0) {
          balances.push({
            symbol: item.asset,
            amount,
            type: 'flexible'
          })
        }
      }
    }

    return res.status(200).json({ balances })
  } catch (error: any) {
    console.error('Binance Earn function error:', error)
    // Earn 查詢失敗不應該影響主要功能，返回空結果
    return res.status(200).json({ balances: [] })
  }
}
