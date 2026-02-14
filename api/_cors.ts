import type { VercelRequest, VercelResponse } from '@vercel/node'

const ALLOWED_ORIGINS = [
  'https://crypto-oneview.vercel.app',
  'http://localhost:5173',
]

/**
 * 設定 CORS headers，僅允許白名單中的 origin。
 * 回傳 true 表示 origin 合法，false 表示不在白名單中。
 */
export function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin as string | undefined

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return true
  }

  return false
}

/**
 * 過濾錯誤訊息中的敏感資訊：
 * - apikey / signature 參數值
 * - 連續 32+ 英數字元（疑似 API Key）
 * - IP 地址
 */
export function sanitizeErrorMessage(msg: string): string {
  return msg
    .replace(/apikey=[^&\s]+/gi, 'apikey=***')
    .replace(/signature=[^&\s]+/gi, 'signature=***')
    .replace(/[A-Za-z0-9]{32,}/g, '***')
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '*.*.*.*')
}
