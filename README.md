# CryptoOneView

統一管理加密資產的安全儀表板，支援多交易所與鏈上錢包。

**Live Demo**: https://crypto-oneview.vercel.app/

## 功能

- **多交易所** — Binance、OKX，涵蓋 spot / earn / funding / futures / staking 等子帳戶
- **鏈上錢包** — BTC (Blockchain.com)、ETH (Etherscan)、ADA (Koios)
- **安全** — AES-256 本地加密、30 分鐘自動鎖定、零資料上傳
- **動態幣種** — 自動偵測持倉並查詢價格，過濾 < $1 塵埃資產
- **Registry 架構** — 新增交易所只需改 config + 新增 API endpoint，UI 自動適配

## 快速開始

```bash
git clone https://github.com/chun0Hsu/CryptoOneView.git
cd CryptoOneView
npm install
npm run dev          # Vite dev server
npm run dev:vercel   # 含 serverless functions
npm run build        # type-check + production build
```

## 使用方式

1. 首次使用設定解鎖密碼（至少 6 字元）
2. **Settings → 交易所 API** — 新增 Binance / OKX 的 Read-Only API Key
3. **Settings → 錢包地址** — 新增 BTC / ETH / ADA 錢包地址
4. 點擊 **Refresh**，系統自動查詢所有來源的餘額與價格

## 架構

```
Frontend:  Vue 3 + TypeScript + Pinia + Tailwind CSS + Chart.js
Backend:   Vercel Serverless Functions (Node.js)
Crypto:    CryptoJS (AES-256)
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
└── okx.ts           # OKX 統一 API proxy (trading/savings/funding/staking)
```

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

## 授權

MIT License
