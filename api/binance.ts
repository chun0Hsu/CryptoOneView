import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'
import { setCorsHeaders, sanitizeErrorMessage } from './_cors.js'

interface RequestBody {
  apiKey: string
  secret: string
  type: string
}

interface BalanceItem {
  symbol: string
  amount: number
  type: string
}

// 共用：建立 HMAC-SHA256 簽名
function sign(queryString: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(queryString).digest('hex')
}

// 共用：呼叫 Binance API (GET)
async function callBinance(
  baseUrl: string,
  endpoint: string,
  params: Record<string, string>,
  apiKey: string,
  secret: string
): Promise<any> {
  const timestamp = Date.now()
  const qs = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString()
  const signature = sign(qs, secret)
  const url = `${baseUrl}${endpoint}?${qs}&signature=${signature}`

  const response = await fetch(url, {
    headers: { 'X-MBX-APIKEY': apiKey },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.msg || `HTTP ${response.status}`)
  }

  return response.json()
}

// 共用：呼叫 Binance API (POST)
async function callBinancePost(
  baseUrl: string,
  endpoint: string,
  params: Record<string, string>,
  apiKey: string,
  secret: string
): Promise<any> {
  const timestamp = Date.now()
  const qs = new URLSearchParams({ ...params, timestamp: timestamp.toString() }).toString()
  const signature = sign(qs, secret)
  const url = `${baseUrl}${endpoint}?${qs}&signature=${signature}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'X-MBX-APIKEY': apiKey },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.msg || `HTTP ${response.status}`)
  }

  return response.json()
}

// Spot 帳戶
async function fetchSpot(apiKey: string, secret: string): Promise<BalanceItem[]> {
  const data = await callBinance('https://api.binance.com', '/api/v3/account', {}, apiKey, secret)
  const balances: BalanceItem[] = []

  for (const b of data.balances || []) {
    const free = parseFloat(b.free)
    const locked = parseFloat(b.locked)
    const total = free + locked
    if (total > 0) {
      balances.push({ symbol: b.asset, amount: total, type: 'spot' })
    }
  }

  return balances
}

// Earn — Flexible
async function fetchEarnFlexible(apiKey: string, secret: string): Promise<BalanceItem[]> {
  const data = await callBinance(
    'https://api.binance.com',
    '/sapi/v1/simple-earn/flexible/position',
    { size: '100' },
    apiKey,
    secret
  )
  const balances: BalanceItem[] = []

  if (data.rows && Array.isArray(data.rows)) {
    for (const item of data.rows) {
      const amount = parseFloat(item.totalAmount || '0')
      if (amount > 0) {
        balances.push({ symbol: item.asset, amount, type: 'earn_flexible' })
      }
    }
  }

  return balances
}

// Earn — Locked
async function fetchEarnLocked(apiKey: string, secret: string): Promise<BalanceItem[]> {
  const data = await callBinance(
    'https://api.binance.com',
    '/sapi/v1/simple-earn/locked/position',
    { size: '100' },
    apiKey,
    secret
  )
  const balances: BalanceItem[] = []

  if (data.rows && Array.isArray(data.rows)) {
    for (const item of data.rows) {
      const amount = parseFloat(item.amount || '0')
      if (amount > 0) {
        balances.push({ symbol: item.asset, amount, type: 'earn_locked' })
      }
    }
  }

  return balances
}

// Funding 帳戶
async function fetchFunding(apiKey: string, secret: string): Promise<BalanceItem[]> {
  const data = await callBinancePost(
    'https://api.binance.com',
    '/sapi/v1/asset/get-funding-asset',
    {},
    apiKey,
    secret
  )
  const balances: BalanceItem[] = []

  if (Array.isArray(data)) {
    for (const item of data) {
      const free = parseFloat(item.free || '0')
      const locked = parseFloat(item.locked || '0')
      const total = free + locked
      if (total > 0) {
        balances.push({ symbol: item.asset, amount: total, type: 'funding' })
      }
    }
  }

  return balances
}

// USDT-M Futures
async function fetchFuturesUsdt(apiKey: string, secret: string): Promise<BalanceItem[]> {
  const data = await callBinance('https://fapi.binance.com', '/fapi/v2/balance', {}, apiKey, secret)
  const balances: BalanceItem[] = []

  if (Array.isArray(data)) {
    for (const item of data) {
      const balance = parseFloat(item.balance || '0')
      if (balance > 0) {
        balances.push({ symbol: item.asset, amount: balance, type: 'futures_usdt' })
      }
    }
  }

  return balances
}

// COIN-M Futures
async function fetchFuturesCoin(apiKey: string, secret: string): Promise<BalanceItem[]> {
  const data = await callBinance('https://dapi.binance.com', '/dapi/v1/balance', {}, apiKey, secret)
  const balances: BalanceItem[] = []

  if (Array.isArray(data)) {
    for (const item of data) {
      const balance = parseFloat(item.balance || '0')
      if (balance > 0) {
        balances.push({ symbol: item.asset, amount: balance, type: 'futures_coin' })
      }
    }
  }

  return balances
}

// Handler map
const handlers: Record<string, (apiKey: string, secret: string) => Promise<BalanceItem[]>> = {
  spot: fetchSpot,
  earn_flexible: fetchEarnFlexible,
  earn_locked: fetchEarnLocked,
  funding: fetchFunding,
  futures_usdt: fetchFuturesUsdt,
  futures_coin: fetchFuturesCoin,
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { apiKey, secret, type } = req.body as RequestBody

    if (!apiKey || !secret || !type) {
      return res.status(400).json({ error: 'Missing apiKey, secret, or type' })
    }

    const fetchFn = handlers[type]
    if (!fetchFn) {
      return res.status(400).json({ error: `Unknown type: ${type}` })
    }

    try {
      const balances = await fetchFn(apiKey, secret)
      return res.status(200).json({ balances })
    } catch (error: any) {
      // 非阻塞：回傳 200 但帶 error
      const msg = sanitizeErrorMessage(error.message || '')
      console.warn(`Binance ${type} fetch failed:`, msg)
      return res.status(200).json({ balances: [], error: msg })
    }
  } catch (error: any) {
    console.error('Binance API handler error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
