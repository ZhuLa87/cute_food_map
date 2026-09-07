# Project CF (Cute Food Map)

## 目錄
- [Concept](#concept)
- [功能介紹](#功能介紹)
- [專案架構](#專案架構)
- [技術棧](#技術棧)
- [快速開始](#快速開始)
- [API 文件](#api-文件)
- [線上展示](#線上展示)
- [授權條款](#授權條款)

## Concept
對於學生、教師以及任何常常來往於校園的使用者來說，這個網站能提供方便、及時的美食資訊，防止踩雷。

## 功能介紹
- 餐廳類別快速篩選（中式、西式、日式、美式、東南亞、飲品、其他）
- 店家資訊，包含菜單、分類與營業時間等
- 篩選目前正在營業的店家

## 專案架構
本 repo 包含後端 API、資料庫匯入工具與部署設定；**前端頁面部署在其他平台**，不在此 repo 範圍內。

```
.
├── Backend/    # Express API 伺服器（含 Swagger UI）
├── DataBase/   # 資料表結構與 CSV 匯入腳本
├── Nginx/      # 反向代理設定
├── docker-compose.example.yml  # 容器部署範本
└── DEPLOYMENT.md                # 部署說明文件
```

## 技術
- UI/UX: Figma
- 前端: HTML, CSS, JavaScript（獨立部署，見[線上展示](#線上展示)）
- 後端: Node.js (Express), Swagger UI
- 資料庫: MariaDB (MySQL)
- 部署: Docker / Docker Compose, Nginx

## 快速開始
本機開發請參考各子專案的說明文件：
- 後端 API：見 [`Backend/README.md`](Backend/README.md)
- 資料庫建置與資料匯入：見 [`DataBase/README.md`](DataBase/README.md)

正式站部署（Docker Compose、Nginx）參考 [`DEPLOYMENT.md`](DEPLOYMENT.md)。

## API 文件
後端啟動後，可透過 Swagger UI 查看完整 API 文件：
```
http://localhost:3000/api-docs
```

## 線上展示
https://cutefoodmap.zzowo.com/

## 授權條款
本專案採用 [GNU General Public License v3.0](LICENSE) 授權。
