# 🪙 CryptoOneView

> 統一管理您的加密資產 - 支援多交易所與鏈上錢包的資產儀表板

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge-id/deploy-status)](https://profound-meringue-2e61b7.netlify.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[🚀 Live Demo](https://profound-meringue-2e61b7.netlify.app/) | [📖 文檔](#功能特色) | [🐛 回報問題](https://github.com/chun0Hsu/CryptoOneView/issues)

---

## 📸 預覽

![CryptoOneView Dashboard](https://via.placeholder.com/800x450.png?text=Dashboard+Preview)

## ✨ 功能特色

### 🔐 安全優先
- **本地加密儲存** - 所有資料（包括 API Keys）加密後存儲在瀏覽器本地
- **密碼保護** - 設定密碼解鎖，確保資料安全
- **自動鎖定** - 30 分鐘無操作自動鎖定
- **隱私第一** - 不上傳任何資料到第三方伺服器

### 📊 多平台整合
- **交易所支援**
  - ✅ Binance（現貨 + Earn）
  - ✅ OKX（現貨 + Earn）

- **鏈上錢包查詢**
  - ✅ Bitcoin (BTC)
  - ✅ Ethereum (ETH)

### 💎 即時資料
- 🔄 一鍵刷新所有平台資產
- 💰 CoinGecko 實時價格查詢
- 📈 資產分佈圖表化呈現
- 🎯 多來源過濾顯示

### 🎨 優雅體驗
- 🌙 深色 OKX 科技風格界面
- 📱 Toast 通知系統
- ⏳ 流暢的 Loading 動畫
- 🎓 新手引導與空狀態提示

---

## 🚀 快速開始

### 前置需求

- Node.js 18+
- npm 或 yarn

### 安裝

\`\`\`bash
# Clone repository
git clone https://github.com/chun0Hsu/CryptoOneView.git
cd CryptoOneView

# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
\`\`\`

訪問 `http://localhost:5173` 開始使用！

### 打包部署

\`\`\`bash
# 生產環境打包
npm run build

# 預覽打包結果
npm run preview
\`\`\`

---

## 🔧 使用指南

### 1. 首次使用

1. 開啟應用後，設定解鎖密碼（至少 6 個字元）
2. 進入 Settings 新增資料來源

### 2. 新增交易所 API

#### Binance
1. 登入 [Binance](https://www.binance.com) → API Management
2. 建立 API Key（**僅勾選 Read Info 權限**）
3. 複製 API Key 和 Secret
4. 在 CryptoOneView Settings 中新增

#### OKX
1. 登入 [OKX](https://www.okx.com) → API
2. 建立 API Key（**僅勾選 Read 權限**）
3. 複製 API Key、Secret 和 Passphrase
4. 在 CryptoOneView Settings 中新增

### 3. 新增鏈上錢包

直接輸入你的 BTC 或 ETH 地址即可。

### 4. 查看資產

點擊 **Refresh** 按鈕，系統會自動查詢並彙整所有平台的資產。

---

## 🛠️ 技術棧

- **框架**: Vue 3 + TypeScript
- **狀態管理**: Pinia
- **樣式**: Tailwind CSS
- **圖表**: Chart.js
- **加密**: CryptoJS
- **構建工具**: Vite
- **部署**: Netlify

---

## 🔒 安全性說明

### ⚠️ 重要提醒

1. **API Key 權限**
   - ✅ 僅使用 **Read-Only（只讀）** 權限
   - ❌ 不要給予交易、提現等權限

2. **資料儲存**
   - 所有資料加密後儲存在瀏覽器 LocalStorage
   - 密碼遺失將無法復原，需重新設定
   - 建議定期備份重要 API Keys

3. **使用環境**
   - 不建議在公共電腦使用
   - 使用完畢建議鎖定或登出

---

## 📋 路線圖

### V1.0 ✅
- [x] 基礎資產查詢
- [x] Binance / OKX 整合
- [x] BTC / ETH 鏈上查詢
- [x] 加密儲存系統
- [x] 深色主題界面

### V2.0 🚧
- [ ] 響應式設計（手機版）
- [ ] 更多交易所（Bybit、KuCoin）
- [ ] 更多鏈支援（SOL、MATIC、BSC）
- [ ] 歷史資料記錄
- [ ] 資產變動圖表
- [ ] 匯出報表（CSV/PDF）

### V3.0 💡
- [ ] 多語言支援
- [ ] 自定義提醒
- [ ] 投資組合分析
- [ ] DeFi 協議整合

---

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

1. Fork 本專案
2. 建立功能分支 (\`git checkout -b feature/AmazingFeature\`)
3. 提交更改 (\`git commit -m 'Add some AmazingFeature'\`)
4. 推送到分支 (\`git push origin feature/AmazingFeature\`)
5. 開啟 Pull Request

---

## 📄 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 文件

---

## 🙏 致謝

- [CoinGecko](https://www.coingecko.com/) - 加密貨幣價格 API
- [Blockchain.com](https://www.blockchain.com/) - BTC 鏈上查詢
- [Etherscan](https://etherscan.io/) - ETH 鏈上查詢
- [Chart.js](https://www.chartjs.org/) - 圖表庫
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架

---

## 📧 聯絡

如有任何問題或建議，歡迎透過 [Issues](https://github.com/chun0Hsu/CryptoOneView/issues) 聯繫我們。

---

<div align="center">

**Made with ❤️ for the Crypto Community**

⭐ 如果這個專案對你有幫助，請給個星星！

</div>
