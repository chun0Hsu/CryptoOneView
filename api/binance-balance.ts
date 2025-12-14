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
  // CORS headers
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

    const url = `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`

    const response = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return res.status(response.status).json({
        error: errorData.msg || 'Binance API error'
      })
    }

    const data = await response.json()

    const supportedSymbols = ['BTC', 'ETH', 'ADA', 'USDT', 'USDC']
    const balances: any[] = []

    for (const balance of data.balances) {
      if (supportedSymbols.includes(balance.asset)) {
        const free = parseFloat(balance.free)
        const locked = parseFloat(balance.locked)
        const total = free + locked

        if (total > 0) {
          balances.push({
            symbol: balance.asset,
            free,
            locked,
            total
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
