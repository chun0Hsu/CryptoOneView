import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

interface RequestBody {
  apiKey: string
  secret: string
  passphrase: string
}

interface EarnBalance {
  symbol: string
  amount: number
  type: string
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
    const requestPath = '/api/v5/finance/savings/balance'  // 🔥 餘幣寶
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
      console.warn('OKX Earn API failed')
      return res.status(200).json({ balances: [] })
    }

    const data = await response.json()

    if (data.code !== '0') {
      console.warn('OKX Earn API error:', data.msg)
      return res.status(200).json({ balances: [] })
    }

    const balances: EarnBalance[] = []

    // 解析餘幣寶餘額
    for (const item of data.data || []) {
      const amount = parseFloat(item.amt || '0')
      if (amount > 0) {
        balances.push({
          symbol: item.ccy,
          amount,
          type: 'savings'
        })
      }
    }

    return res.status(200).json({ balances })
  } catch (error: any) {
    console.error('OKX Earn error:', error)
    return res.status(200).json({ balances: [] })
  }
}
