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
    const requestPath = '/api/v5/account/balance'
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
        body: JSON.stringify({ error: 'OKX API error' })
      }
    }

    const data = await response.json()

    if (data.code !== '0') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: data.msg || 'OKX API error' })
      }
    }

    // 過濾出支援的幣種
    const supportedSymbols = ['BTC', 'ETH', 'ADA', 'USDT', 'USDC']
    const balances = (data.data[0]?.details || [])
      .filter((d: any) => supportedSymbols.includes(d.ccy))
      .filter((d: any) => parseFloat(d.eq || '0') > 0)
      .map((d: any) => {
        const total = parseFloat(d.eq || '0')
        const free = parseFloat(d.availBal || '0')
        return {
          symbol: d.ccy,
          free,
          used: total - free,
          total
        }
      })

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
