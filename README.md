# CryptoOneView

> 統一管理您的加密資產 - 支援多交易所與鏈上錢包的資產儀表板

🚀 **Live Demo**: https://crypto-oneview.vercel.app/

---

## 功能特色

### 安全優先
- 所有資料加密儲存在本地瀏覽器（AES-256）
- 密碼保護機制
- 不上傳任何資料到第三方伺服器
- API Key 加密儲存，僅在查詢時解密

### 支援平台
- **交易所**: Binance、OKX（現貨 + Earn）
- **鏈上錢包**: Ethereum (ETH)、Bitcoin (BTC)

### 核心功能
- 一鍵刷新所有平台資產
- CoinGecko 實時價格查詢
- 資產分佈圓餅圖視覺化
- 多來源過濾顯示
- Toast 通知系統

---

## 快速開始





```bash
# Clone 專案
git clone https://github.com/chun0Hsu/CryptoOneView.git
cd CryptoOneView

# 安裝依賴
npm install

# 啟動開發環境
npm run dev

# 或使用 Vercel 開發環境（測試 API）
npm run dev:vercel

# 打包部署
npm run build
```

---

## 使用指南

### 1. 設定密碼
首次使用設定解鎖密碼（至少 6 個字元）

### 2. 新增資料來源

#### 交易所 API
- 前往交易所 API 管理頁面
- 建立 **Read-Only** 權限的 API Key
- 在 Settings → 交易所 API 中新增
  - **Binance**: API Key + Secret
  - **OKX**: API Key + Secret + Passphrase

#### 鏈上錢包
- 在 Settings → 錢包地址 中新增
- **ETH 地址**: 建議填寫 [Etherscan API Key](https://etherscan.io/myapikey)（免費申請，避免查詢限制）
- **BTC 地址**: 直接輸入地址即可

### 3. 查詢資產
點擊 **Refresh** 按鈕即可查詢並彙整所有資產

---

## 技術棧

### 前端
- Vue 3 + TypeScript
- Pinia (狀態管理)
- Tailwind CSS
- Chart.js (圖表)
- CryptoJS (AES-256 加密)
- Vite (建構工具)

### 後端
- Vercel Serverless Functions
- Node.js + TypeScript
- 部署區域：新加坡/香港（避免 Binance 美國 IP 限制）

---

## 安全提醒

⚠️ **重要事項**

1. **API Key 僅使用 Read-Only（只讀）權限**
   - 不要給予交易、提現等權限
2. **密碼遺失無法復原**
   - 請妥善保管密碼
   - 遺失需清空 LocalStorage 重新設定
3. **不建議在公共電腦使用**
   - 使用完畢建議關閉瀏覽器或清除快取
4. **API 呼叫經由亞洲伺服器**
   - 新加坡/香港節點
   - 確保 Binance 服務可用性

---

## 已知限制

### 功能限制

1. **桌面版優先**
   - 目前 UI 僅針對桌面優化
   - 手機版支援將在 V2.0 實作

2. **有限的幣種支援**
   - 目前支援：BTC, ETH, USDT, USDC
   - V2.0 將擴充更多幣種

3. **鏈上查詢限制**
   - ✅ **ETH**: 完整支援（建議設定 Etherscan API Key）
   - ✅ **BTC**: 支援單一地址查詢
   - ⏸️ **ADA**: 暫未支援（V2.0 將實作）
   - ⏸️ **Ledger HD 錢包**: 暫不支援 xpub 查詢（V2.0 將實作）

4. **僅支援現貨與理財**
   - 目前僅查詢現貨帳戶與 Earn 產品
   - 合約部位將在 V2.0 實作

---

## 開發路線圖

### V1.0 ✅ (已完成)
- [x] Binance / OKX API 整合（現貨 + Earn）
- [x] ETH 鏈上查詢（含 Etherscan API Key 支援）
- [x] BTC 單一地址查詢
- [x] 加密儲存系統（AES-256）
- [x] 資產分佈圓餅圖
- [x] Toast 通知系統

### V2.0 🚧 (計劃中)

#### 優先度 P0（必做）
- [ ] **合約部位查詢**
  - Binance 合約帳戶（USDT-M、Coin-M）
  - OKX 合約帳戶
  - 持倉、未實現盈虧顯示
  
- [ ] **響應式設計**
  - 手機版優化
  - 平板版優化
  
- [ ] **完整鏈上支援**
  - ADA (Cardano) 查詢
  - Ledger HD 錢包 (xpub 查詢)
  - 更多鏈（SOL、MATIC、BSC）

#### 優先度 P1（重要）
- [ ] **匯出功能**
  - CSV 匯出
  - PDF 報表
  
- [ ] **更多幣種支援**
  - 擴充至 20+ 主流幣種

#### 優先度 P2（加分）
- [ ] **自定義提醒**（資產變動通知）
- [ ] **投資組合分析**

---

## 常見問題

### Q: 密碼遺失怎麼辦？
**A**: 密碼無法復原。需要清空 LocalStorage 重新設定。建議妥善保管密碼。

### Q: API Key 會被上傳到伺服器嗎？
**A**: 不會。API Key 加密後儲存在瀏覽器本地，只在需要時解密並傳送給 Vercel Serverless Functions 呼叫交易所 API。

### Q: 為什麼 ETH 查詢建議設定 API Key？
**A**: Etherscan 免費 API 有 rate limit（每秒 1 次）。設定 API Key 後可提升至每秒 5 次，避免查詢失敗。API Key 免費申請：https://etherscan.io/myapikey

### Q: Ledger 硬體錢包為什麼無法顯示完整餘額？
**A**: Ledger 使用 HD（分層確定性）錢包架構，每次接收會生成新地址。目前僅支援單一地址查詢，完整支援（xpub 查詢）將在 V2.0 實作。

### Q: 支援合約帳戶查詢嗎？
**A**: V1.0 僅支援現貨與 Earn 產品。合約部位查詢（Futures、持倉、未實現盈虧）將在 V2.0 實作。

### Q: 支援哪些瀏覽器？
**A**: 支援最新版的 Chrome、Firefox、Safari、Edge。

---

## 授權

MIT License

---

## 致謝

- [CoinGecko](https://www.coingecko.com/) - 加密貨幣價格 API
- [Blockchain.com](https://www.blockchain.com/) - BTC 鏈上查詢
- [Etherscan](https://etherscan.io/) - ETH 鏈上查詢
- [Vercel](https://vercel.com/) - 部署平台
- [Chart.js](https://www.chartjs.org/) - 圖表庫

---

⭐ 如果這個專案對你有幫助，請給個星星！
