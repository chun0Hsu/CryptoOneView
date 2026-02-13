# CryptoOneView

統一管理加密資產的安全儀表板，支援多交易所、鏈上錢包與硬體冷錢包。

**Live Demo**: https://crypto-oneview.vercel.app/

## 功能

- **多交易所** — Binance、OKX，涵蓋 spot / earn / funding / futures / staking 等子帳戶
- **鏈上錢包** — BTC、ETH、ADA，支援熱錢包與冷錢包地址
- **Ledger 冷錢包** — BTC 支援 xpub/ypub/zpub（BIP84 Native SegWit 地址衍生）、ADA 支援 stake address
- **安全** — AES-256 本地加密、30 分鐘自動鎖定、零資料上傳
- **動態幣種** — 自動偵測持倉並查詢價格，過濾 < $1 塵埃資產
- **Registry 架構** — 新增交易所只需改 config + 新增 API endpoint，UI 自動適配

## 快速開始

```bash
git clone https://github.com/chun0Hsu/CryptoOneView.git
cd CryptoOneView
npm install
npm run dev          # Vite dev server（僅前端）
npm run dev:vercel   # 含 serverless functions（完整功能）
npm run build        # type-check + production build
```

## 使用方式

1. 首次使用設定解鎖密碼（至少 6 字元）
2. **Settings → 交易所 API** — 新增 Binance / OKX 的 Read-Only API Key
3. **Settings → 錢包地址** — 新增鏈上錢包地址：
   - **BTC** — 單一地址（`1...`、`3...`、`bc1...`）或 extended key（`xpub`、`zpub`）
   - **ETH** — 地址（`0x...`），可選填 Etherscan API Key 避免限流
   - **ADA** — stake address（`stake1...`）或 payment address（`addr1...`）
4. 點擊 **Refresh**，系統自動查詢所有來源的餘額與價格

## 架構

```
Frontend:  Vue 3 + TypeScript + Pinia + Tailwind CSS + Chart.js
Backend:   Vercel Serverless Functions (Node.js)
Crypto:    CryptoJS (AES-256)、@scure/bip32 (HD 金鑰衍生)、bs58check (Base58 編碼)
```

```
src/
├── config/          # Registry 設定 (exchanges, sources, chains)
├── components/      # Vue 元件 (Dashboard, SettingsModal, AssetChart, ...)
├── stores/          # Pinia stores (auth, credential, wallet, asset, toast)
├── services/        # API 呼叫 (exchangeService, chainService, priceService)
└── types/           # TypeScript 型別
api/
├── binance.ts       # Binance 統一 API proxy (spot/earn/funding/futures)
├── okx.ts           # OKX 統一 API proxy (trading/savings/funding/staking)
└── chain.ts         # 鏈上餘額查詢 proxy (BTC/ETH/ADA)
```

### 鏈上查詢架構

所有鏈上餘額查詢透過 `api/chain.ts` serverless function 代理，避免 CORS 與 Cloudflare 限制：

| 鏈 | API 來源 | 特殊支援 |
|----|---------|---------|
| BTC | blockchain.info | xpub/zpub BIP84 地址衍生 + 批次查詢 |
| ETH | Etherscan | 支援自訂 API Key |
| ADA | Koios | stake address 帳戶總餘額（含 staking rewards） |

## 新增交易所（以 Bybit 為例）

只需 3 步：

1. `src/config/exchanges.ts` — 新增 Bybit config + accountTypes
2. `src/config/sources.ts` — 新增 `bybit_cex` source
3. `api/bybit.ts` — 新增 serverless function

Dashboard、SettingsModal、stores 全部自動適配。

## 安全提醒

- API Key 請使用 **Read-Only** 權限（不要給予交易/提現權限）
- 密碼遺失無法復原（需 `localStorage.clear()` 重設）
- 不建議在公共電腦使用
- 鏈上查詢不需要任何私鑰，僅使用公開地址或 extended public key

## 授權

MIT License
