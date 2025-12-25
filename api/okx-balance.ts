import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

interface RequestBody {
  apiKey: string
  secret: string
  passphrase: string
}

interface OKXBalance {
  symbol: string
  free: number
  locked: number
  total: number
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
    const { apiKey, secret, passphrase } = req.body as RequestBody

    if (!apiKey || !secret || !passphrase) {
      return res.status(400).json({ error: 'Missing credentials' })
    }

    const timestamp = new Date().toISOString()
    const method = 'GET'
    const requestPath = '/api/v5/account/balance'  // 🔥 不帶 ccy 參數，獲取所有資產
    const message = timestamp + method + requestPath
    const signature = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('base64')

    const url = `https://www.okx.com${requestPath}`

    const response = await fetch(url, {
      headers: {
        'OK-ACCESS-KEY': apiKey,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': passphrase,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: 'OKX API error' })
    }

    const data = await response.json()

    if (data.code !== '0') {
      return res.status(400).json({ error: data.msg || 'OKX API error' })
    }

    // 🔥 動態抓取所有非零餘額
    const balances: OKXBalance[] = []

    for (const account of data.data || []) {
      for (const detail of account.details || []) {
        const total = parseFloat(detail.cashBal || '0')
        if (total > 0) {
          balances.push({
            symbol: detail.ccy,
            free: total,
            locked: 0,
            total
          })
        }
      }
    }

    return res.status(200).json({ balances })
  } catch (error: any) {
    console.error('OKX balance error:', error)
    return res.status(500).json({
      error: error.message || 'Internal server error'
    })
  }
}
