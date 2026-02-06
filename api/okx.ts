import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

interface RequestBody {
  apiKey: string
  secret: string
  passphrase: string
  type: string
}

interface BalanceItem {
  symbol: string
  amount: number
  type: string
}

// 共用：OKX 簽名
function signOKX(timestamp: string, method: string, path: string, secret: string): string {
  const message = timestamp + method + path
  return crypto.createHmac('sha256', secret).update(message).digest('base64')
}

// 共用：呼叫 OKX API
async function callOKX(
  path: string,
  apiKey: string,
  secret: string,
  passphrase: string
): Promise<any> {
  const timestamp = new Date().toISOString()
  const method = 'GET'
  const signature = signOKX(timestamp, method, path, secret)

  const response = await fetch(`https://www.okx.com${path}`, {
    headers: {
      'OK-ACCESS-KEY': apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': passphrase,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const data = await response.json()

  if (data.code !== '0') {
    throw new Error(data.msg || 'OKX API error')
  }

  return data
}

// Trading 帳戶（原 balance）
async function fetchTrading(
  apiKey: string, secret: string, passphrase: string
): Promise<BalanceItem[]> {
  const data = await callOKX('/api/v5/account/balance', apiKey, secret, passphrase)
  const balances: BalanceItem[] = []

  for (const account of data.data || []) {
    for (const detail of account.details || []) {
      const total = parseFloat(detail.cashBal || '0')
      if (total > 0) {
        balances.push({ symbol: detail.ccy, amount: total, type: 'trading' })
      }
    }
  }

  return balances
}

// Savings（餘幣寶）
async function fetchSavings(
  apiKey: string, secret: string, passphrase: string
): Promise<BalanceItem[]> {
  const data = await callOKX('/api/v5/finance/savings/balance', apiKey, secret, passphrase)
  const balances: BalanceItem[] = []

  for (const item of data.data || []) {
    const amount = parseFloat(item.amt || '0')
    if (amount > 0) {
      balances.push({ symbol: item.ccy, amount, type: 'savings' })
    }
  }

  return balances
}

// Funding 帳戶
async function fetchFunding(
  apiKey: string, secret: string, passphrase: string
): Promise<BalanceItem[]> {
  const data = await callOKX('/api/v5/asset/balances', apiKey, secret, passphrase)
  const balances: BalanceItem[] = []

  for (const item of data.data || []) {
    const available = parseFloat(item.availBal || '0')
    const frozen = parseFloat(item.frozenBal || '0')
    const total = available + frozen
    if (total > 0) {
      balances.push({ symbol: item.ccy, amount: total, type: 'funding' })
    }
  }

  return balances
}

// Staking
async function fetchStaking(
  apiKey: string, secret: string, passphrase: string
): Promise<BalanceItem[]> {
  const data = await callOKX('/api/v5/finance/staking-defi/orders-active', apiKey, secret, passphrase)
  const balances: BalanceItem[] = []

  for (const item of data.data || []) {
    const amount = parseFloat(item.investAmt || '0')
    if (amount > 0) {
      balances.push({ symbol: item.ccy, amount, type: 'staking' })
    }
  }

  return balances
}

// Handler map
const handlers: Record<string, (apiKey: string, secret: string, passphrase: string) => Promise<BalanceItem[]>> = {
  trading: fetchTrading,
  savings: fetchSavings,
  funding: fetchFunding,
  staking: fetchStaking,
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const { apiKey, secret, passphrase, type } = req.body as RequestBody

    if (!apiKey || !secret || !passphrase || !type) {
      return res.status(400).json({ error: 'Missing apiKey, secret, passphrase, or type' })
    }

    const fetchFn = handlers[type]
    if (!fetchFn) {
      return res.status(400).json({ error: `Unknown type: ${type}` })
    }

    try {
      const balances = await fetchFn(apiKey, secret, passphrase)
      return res.status(200).json({ balances })
    } catch (error: any) {
      // 非阻塞：回傳 200 但帶 error
      console.warn(`OKX ${type} fetch failed:`, error.message)
      return res.status(200).json({ balances: [], error: error.message })
    }
  } catch (error: any) {
    console.error('OKX API handler error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
