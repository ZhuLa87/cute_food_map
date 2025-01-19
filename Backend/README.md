# Project CF - Backend

## 專案描述

這是一個用於管理餐廳資訊的後端服務，提供餐廳的基本資訊、類別和營業時間等功能。

## 安裝步驟

1. 複製專案到本地端：
   ```bash
   git clone git@github.com:[REDACTED]/Project-CF.git
   ```
2. 進入專案目錄：
   ```bash
   cd Project-CF/Backend/
   ```
3. 安裝所需的套件：
   ```bash
   pnpm install
   ```
4. 設定環境變數：
   - 複製 `.env.example` 並重新命名為 `.env`
   - 根據需要修改 `.env` 文件中的設定

## 使用說明

1. 啟動伺服器：
   ```bash
   pnpm start
   ```
2. 伺服器啟動後，可以透過以下 URL 訪問 API：
   ```
   http://localhost:22931/api/
   ```

## API 文件

啟動伺服器後，可以透過以下 URL 訪問 Swagger UI 以查看 API 文件：

```
http://localhost:22931/api-docs
```
