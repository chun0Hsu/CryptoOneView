import { Handler } from '@netlify/functions'
import crypto from 'crypto'

interface RequestBody {
  apiKey: string
  secret: string
}

export const handler: Handler = async (event) => {
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

    // 呼叫 Binance Earn API
    const url = `https://api.binance.com/sapi/v1/lending/union/account?${queryString}&signature=${signature}`

    const response = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: errorData.msg || 'Binance Earn API error' })
      }
    }

    const data = await response.json()

    // 解析 Earn 餘額
    const supportedSymbols = ['BTC', 'ETH', 'ADA', 'USDT', 'USDC']
    const balances: any[] = []

    // 彈性產品 (Flexible)
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
