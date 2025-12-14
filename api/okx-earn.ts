import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

interface RequestBody {
  apiKey: string
  secret: string
  passphrase: string
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
    const requestPath = '/api/v5/finance/savings/balance'
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
      return res.status(response.status).json({ error: 'OKX Earn API error' })
    }

    const data = await response.json()

    if (data.code !== '0') {
      return res.status(400).json({ error: data.msg || 'OKX Earn API error' })
    }

    const supportedSymbols = ['BTC', 'ETH', 'ADA', 'USDT', 'USDC']
    const balances: any[] = []

    for (const item of data.data || []) {
      if (supportedSymbols.includes(item.ccy)) {
        const amount = parseFloat(item.amt || '0')
        if (amount > 0) {
          balances.push({
            symbol: item.ccy,
            amount,
            type: 'savings'
          })
        }
      }
    }

    return res.status(200).json({ balances })
  } catch (error: any) {
    console.error('Function error:', error)
    return res.status(500).json({
      error: error.message || 'Internal server error'
    })
  }
}
