import { Handler } from '@netlify/functions'
import crypto from 'crypto'

interface RequestBody {
  apiKey: string
  secret: string
  passphrase: string
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { apiKey, secret, passphrase } = JSON.parse(event.body || '{}') as RequestBody

    if (!apiKey || !secret || !passphrase) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing apiKey, secret, or passphrase' })
      }
    }

    // OKX 簽名
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
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'OKX Earn API error' })
      }
    }

    const data = await response.json()

    if (data.code !== '0') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: data.msg || 'OKX Earn API error' })
      }
    }

    // 解析 Earn 餘額
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
