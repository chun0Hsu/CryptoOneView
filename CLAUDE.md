# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CryptoOneView is a cryptocurrency portfolio dashboard that aggregates assets from multiple exchanges (Binance, OKX) and on-chain wallets (BTC, ETH). All sensitive data (API keys) is AES-256 encrypted client-side with the user's password; the app follows a zero-data-upload principle.

## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run dev:vercel` — Test Vercel serverless functions locally
- `npm run build` — Type-check with vue-tsc then bundle with Vite
- `npm run preview` — Serve production build locally

There are no test or lint commands configured.

## Architecture

**Frontend:** Vue 3 + TypeScript + Vite, styled with Tailwind CSS. Path alias `@/` maps to `./src/`.

**Backend:** Vercel serverless functions in `/api/*.ts` (Node.js). These proxy exchange API requests to avoid CORS and IP restrictions. Each function receives decrypted credentials via POST, signs the request (HMAC-SHA256), calls the exchange, and returns balances.

**State management:** Pinia with five stores:
- `useAuthStore` — SHA256 password hash, session management, 30-minute auto-lock
- `useCredentialStore` — AES-256 encrypted exchange API keys in localStorage
- `useWalletStore` — On-chain wallet addresses grouped by source/chain
- `useAssetStore` — Asset aggregation, price fetching (1-min cache), dust filtering (<$1)
- `useToastStore` — UI notifications

**Service layer** (`src/services/`):
- `exchangeService.ts` — Fetches balances from Binance/OKX via the Vercel API proxy
- `chainService.ts` — Fetches on-chain balances (Blockchain.com for BTC, Etherscan for ETH)
- `priceService.ts` — Fetches prices from Binance 24hr ticker with caching

**Component hierarchy:**
```
App.vue (login/unlock gate)
└── Dashboard.vue (main view)
    ├── AssetChart.vue (Chart.js pie/doughnut)
    ├── CoinIcon.vue (async icon loader with fallback)
    ├── SettingsModal.vue (API key & wallet config)
    ├── LoadingOverlay.vue
    └── Toast.vue
```

## Key Types

Defined in `src/types/index.ts`:
- `SourceType`: `'binance_cex' | 'okx_cex' | 'binance_hot' | 'okx_hot' | 'ledger_cold'`
- `ExchangeName`: `'binance' | 'okx'`
- `CryptoSymbol`: dynamic string (no hardcoded coin list)
- Core interfaces: `Asset`, `EncryptedCredential`, `PriceData`, `CoinInfo`

## Security Model

- API credentials are AES-256 encrypted in localStorage; decrypted on-demand in the browser
- Session password lives in Pinia memory only, never persisted
- Auto-lock after 30 minutes of inactivity
- Exchange API keys should be read-only (no trading/withdrawal permissions)

## Deployment

Deployed on Vercel. Git push to main triggers auto-deploy. Vercel config in `vercel.json` sets function memory to 1024MB and max duration to 10s. The `/api/*` routes have CORS headers configured.

## TypeScript Configuration

- `tsconfig.app.json` (frontend): target ES2020, strict mode OFF
- `tsconfig.node.json` (build tools): target ES2023, strict mode ON
