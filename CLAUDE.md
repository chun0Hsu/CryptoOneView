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

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First:** Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan:** Check in before starting implementation
3. **Track Progress:** Mark items complete as you go
4. **Explain Changes:** High-level summary at each step
5. **Document Results:** Add review section to `tasks/todo.md`
6. **Capture Lessons:** Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First:** Make every change as simple as possible. Impact minimal code.
- **No Laziness:** Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact:** Changes should only touch what's necessary. Avoid introducing bugs.
