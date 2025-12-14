# CryptoOneView

> 統一管理您的加密資產 - 支援多交易所與鏈上錢包的資產儀表板

🚀 **Live Demo**: https://profound-meringue-2e61b7.netlify.app/

---

## 功能特色

### 安全優先
- 所有資料加密儲存在本地瀏覽器
- 密碼保護與自動鎖定（30分鐘）
- 不上傳任何資料到第三方伺服器

### 支援平台
- **交易所**: Binance、OKX（現貨 + Earn）
- **鏈上錢包**: Bitcoin、Ethereum

### 核心功能
- 一鍵刷新所有平台資產
- CoinGecko 實時價格查詢
- 資產分佈圖表化呈現
- 多來源過濾顯示

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

# 打包部署
npm run build
```

---

## 使用指南

### 1. 設定密碼
首次使用設定解鎖密碼（至少 6 個字元）

### 2. 新增資料來源

**交易所 API**
- 前往交易所 API 管理頁面
- 建立 **Read-Only** 權限的 API Key
- 在 Settings 中新增（OKX 需要 Passphrase）

**鏈上錢包**
- 直接輸入 BTC 或 ETH 地址

### 3. 查詢資產
點擊 **Refresh** 按鈕即可查詢並彙整所有資產

---

## 技術棧

- Vue 3 + TypeScript
- Pinia (狀態管理)
- Tailwind CSS
- Chart.js
- CryptoJS (加密)
- Vite

---

## 安全提醒

⚠️ **重要事項**

1. **API Key 僅使用 Read-Only 權限**
2. **密碼遺失無法復原**，請妥善保管
3. **不建議在公共電腦使用**

---

## 開發路線圖

### V1.0 ✅
- [x] Binance / OKX 整合
- [x] BTC / ETH 鏈上查詢
- [x] 加密儲存系統
- [x] 深色主題界面

### V2.0 (計劃中)
- [ ] 響應式設計（手機版）
- [ ] 更多交易所支援
- [ ] 更多鏈支援（SOL、MATIC、BSC）
- [ ] 歷史資料記錄
- [ ] 匯出報表功能

---

## 授權

MIT License

---

## 致謝

- [CoinGecko](https://www.coingecko.com/) - 價格 API
- [Blockchain.com](https://www.blockchain.com/) - BTC 查詢
- [Etherscan](https://etherscan.io/) - ETH 查詢

---

⭐ 如果這個專案對你有幫助，請給個星星！
