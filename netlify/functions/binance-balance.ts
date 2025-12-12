import { Handler } from '@netlify/functions'
import crypto from 'crypto'

interface RequestBody {
  apiKey: string
  secret: string
}

export const handler: Handler = async (event) => {
  // 只允許 POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { apiKey, secret } = JSON.parse(event.body || '{}') as RequestBody

    if (!apiKey || !secret) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing apiKey or secret' })
      }
    }

    // 建立簽名
    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}`
    const signature = crypto
      .createHmac('sha256', secret)
      .update(queryString)
      .digest('hex')

    // 呼叫 Binance API
    const url = `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`

    const response = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: errorData.msg || 'Binance API error' })
      }
    }

    const data = await response.json()

    // 過濾出支援的幣種
    const supportedSymbols = ['BTC', 'ETH', 'ADA', 'USDT', 'USDC']
    const balances = data.balances
      .filter((b: any) => supportedSymbols.includes(b.asset))
      .filter((b: any) => parseFloat(b.free) + parseFloat(b.locked) > 0)
      .map((b: any) => ({
        symbol: b.asset,
        free: parseFloat(b.free),
        used: parseFloat(b.locked),
        total: parseFloat(b.free) + parseFloat(b.locked)
      }))

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ balances })
    }
  } catch (error: any) {
    console.error('Function error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    }
  }
}
