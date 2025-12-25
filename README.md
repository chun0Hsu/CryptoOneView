# CryptoOneView

> 統一管理您的加密資產 - 支援多交易所與鏈上錢包的安全儀表板

🚀 **Live Demo**: [https://crypto-oneview.vercel.app/](https://crypto-oneview.vercel.app/)

---

## ✨ 功能特色

### 🔐 安全優先
- AES-256 本地加密儲存
- 密碼保護機制（30分鐘自動鎖定）
- API Key 僅在查詢時解密
- 零資料上傳到第三方

### 📊 支援平台
- **交易所**: Binance、OKX（現貨 + 理財）
- **鏈上錢包**: Ethereum、Bitcoin
- **未來支援**: Ledger 冷錢包（開發中）

### 💡 核心功能
- 動態支援所有幣種（自動查詢價格）
- 智能過濾塵埃資產（< $1 USD）
- 實時圓餅圖與來源分布
- 多來源過濾器（全選/單選）
- 理財帳戶完整支援（活期+定期）

---

## 🚀 快速開始





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

## 📖 使用指南

### 1️⃣ 設定密碼
首次使用設定解鎖密碼（至少 6 個字元）

### 2️⃣ 新增資料來源

#### 交易所 API
在 **Settings → 交易所 API** 中新增：
- **Binance**: API Key + Secret（僅需 Read-Only 權限）
- **OKX**: API Key + Secret + Passphrase（僅需 Read-Only 權限）

#### 鏈上錢包
在 **Settings → 錢包地址** 中新增：
- **ETH**: 建議填寫 [Etherscan API Key](https://etherscan.io/myapikey)（免費申請）
- **BTC**: 直接輸入地址即可

### 3️⃣ 查詢資產
點擊 **Refresh** 按鈕，系統會自動：
- 查詢所有交易所的現貨與理財餘額
- 查詢所有鏈上錢包餘額
- 動態查詢所有幣種的 USD 價格
- 過濾低於 $1 USD 的塵埃資產

---

## 🛠 技術棧

**前端**: Vue 3 + TypeScript + Pinia + Tailwind CSS + Chart.js  
**後端**: Vercel Serverless Functions (Node.js)  
**加密**: CryptoJS (AES-256)  
**部署**: Vercel (亞洲節點)

---

## 🔒 安全提醒

⚠️ **重要**

1. **API Key 僅使用 Read-Only 權限**（不要給予交易/提現權限）
2. **密碼遺失無法復原**（需清空 LocalStorage 重設）
3. **不建議在公共電腦使用**（用完記得鎖定）
4. **API 呼叫經由新加坡/香港節點**（避免 Binance IP 限制）

---

## 🎯 版本歷程

### V1.0 ✅ (2024 Q4)
- [x] Binance / OKX API 整合
- [x] ETH / BTC 鏈上查詢
- [x] AES-256 本地加密
- [x] 基礎 UI 與圓餅圖

### V2.0 ✅ (2025 Q1)
- [x] 動態幣種支援（不再限制特定幣種）
- [x] 理財帳戶完整支援（活期+定期）
- [x] 智能塵埃過濾（< $1 USD）
- [x] 新版過濾器 UI（Button 風格）
- [x] 多來源智能圖示（自動 fallback）

### V3.0 🚧 (2025 Q2 計劃)
- [ ] Ledger 冷錢包整合（xpub 查詢）
- [ ] 合約部位查詢（Futures、持倉、PnL）
- [ ] 響應式設計（手機版優化）
- [ ] 更多鏈支援（SOL、ADA、BSC、Polygon）
- [ ] 匯出功能（CSV/PDF）

---

## ❓ 常見問題

**Q: 密碼遺失怎麼辦？**  
A: 無法復原。開啟瀏覽器 Console 執行 `localStorage.clear()` 重設。

**Q: 支援哪些幣種？**  
A: V2.0 已支援動態幣種。只要交易所/錢包有餘額，系統會自動查詢價格並顯示。

**Q: API Key 會被上傳嗎？**  
A: 不會。API Key 加密後僅存在瀏覽器本地，只在查詢時解密並傳給 Vercel Function。

**Q: 為什麼 ETH 查詢建議設定 API Key？**  
A: Etherscan 免費版有 rate limit（1 req/sec）。設定 API Key 後可提升至 5 req/sec。

**Q: Ledger 何時支援？**  
A: V3.0 計劃支援 xpub 查詢，可顯示 HD 錢包所有地址的餘額。

**Q: 支援合約帳戶嗎？**  
A: V2.0 僅支援現貨與理財。合約部位查詢將在 V3.0 實作。

---

## 📄 授權

MIT License

---

## 🙏 致謝

- [Binance API](https://binance-docs.github.io/apidocs/) - 幣安 API 文件
- [OKX API](https://www.okx.com/docs-v5/en/) - 歐易 API 文件  
- [CoinGecko](https://www.coingecko.com/) - 價格查詢 API
- [Etherscan](https://etherscan.io/) - ETH 鏈上查詢
- [Blockchain.com](https://www.blockchain.com/) - BTC 鏈上查詢
- [Vercel](https://vercel.com/) - 部署平台
- [Chart.js](https://www.chartjs.org/) - 圖表庫

---

⭐ 如果這個專案對你有幫助，請給個 Star！
