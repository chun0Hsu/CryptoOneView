import { getExchangeConfig } from '@/config/exchanges'

export interface AccountBalance {
  symbol: string
  amount: number
  accountType: string
}

export interface ExchangeFetchResult {
  balances: AccountBalance[]
  errors: string[]
}

/**
 * 查詢一個交易所的所有子帳戶餘額（並行）
 */
export async function fetchAllExchangeBalances(
  exchangeId: string,
  apiKey: string,
  secret: string,
  passphrase?: string
): Promise<ExchangeFetchResult> {
  const config = getExchangeConfig(exchangeId)
  if (!config) {
    return { balances: [], errors: [`不支援的交易所: ${exchangeId}`] }
  }

  if (config.requiresPassphrase && !passphrase) {
    return { balances: [], errors: [`${config.name} API 需要 Passphrase`] }
  }

  const apiUrl = `/api/${exchangeId}`

  // 並行查詢所有子帳戶
  const results = await Promise.allSettled(
    config.accountTypes.map(async (accountType) => {
      const body: Record<string, string> = {
        apiKey,
        secret,
        type: accountType.apiAction,
      }
      if (passphrase) {
        body.passphrase = passphrase
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const balances: AccountBalance[] = (data.balances || []).map(
        (b: { symbol: string; amount: number }) => ({
          symbol: b.symbol,
          amount: b.amount,
          accountType: accountType.id,
        })
      )

      return balances
    })
  )

  const allBalances: AccountBalance[] = []
  const errors: string[] = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allBalances.push(...result.value)
    } else {
      const accountType = config.accountTypes[index]
      errors.push(`${config.name} ${accountType.label}: ${result.reason?.message || '查詢失敗'}`)
    }
  })

  return { balances: allBalances, errors }
}

/**
 * 驗證 API Key（嘗試查詢 spot 帳戶）
 */
export async function validateAPIKey(
  exchange: string,
  apiKey: string,
  secret: string,
  passphrase?: string
): Promise<{ valid: boolean; error?: string }> {
  const config = getExchangeConfig(exchange)
  if (!config) {
    return { valid: false, error: `不支援的交易所: ${exchange}` }
  }

  if (config.requiresPassphrase && !passphrase) {
    return { valid: false, error: `${config.name} API 需要 Passphrase` }
  }

  const body: Record<string, string> = {
    apiKey,
    secret,
    type: config.accountTypes[0].apiAction,
  }
  if (passphrase) {
    body.passphrase = passphrase
  }

  try {
    const response = await fetch(`/api/${exchange}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { valid: false, error: errorData.error || `HTTP ${response.status}` }
    }

    const data = await response.json()
    if (data.error) {
      return { valid: false, error: data.error }
    }

    return { valid: true }
  } catch (error: any) {
    return { valid: false, error: error.message || '驗證失敗' }
  }
}
