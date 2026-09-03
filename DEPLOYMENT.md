# 部署與維運文件

本文件說明 Cute Food Map 正式站的部署架構、首次部署流程與日常維運方式，供維運交接使用。

## 目錄
- [1. 架構總覽](#1-架構總覽)
- [2. 主機與存取資訊](#2-主機與存取資訊)
- [3. 前置需求](#3-前置需求)
- [4. 環境變數與機密設定](#4-環境變數與機密設定)
- [5. 首次部署流程](#5-首次部署流程)
- [6. 資料庫初始化與資料匯入](#6-資料庫初始化與資料匯入)
- [7. 日常維運指令](#7-日常維運指令)
- [8. 更新部署流程](#8-更新部署流程)
- [9. 資料庫備份與還原](#9-資料庫備份與還原)
- [10. 緊急回滾與復原](#10-緊急回滾與復原)
- [11. 疑難排解 FAQ](#11-疑難排解-faq)
- [12. 安全性注意事項](#12-安全性注意事項)

---

## 1. 架構總覽

網站由三個 Docker 容器組成，透過 `docker-compose.yml` 統一管理，共用一個 bridge network `food_map`：

| 容器 | Image | 對外 Port | 說明 |
|---|---|---|---|
| `nginx` | nginx:alpine | 8888（容器內部仍為 80） | 純 API 反向代理，將 `/api/` 轉發到 backend |
| `backend` | node:22-alpine | 僅內部網路 | Express API 伺服器，含 Swagger UI |
| `mariadb` | mariadb:11.4.4 | 僅內部網路 | 資料庫，資料存放於 named volume `db_data` |

> `backend`、`mariadb` 不對外發布 port，只透過 `food_map` 內部網路互相溝通（nginx → backend、backend → mariadb），這樣也能避開主機上其他服務（例如已經在跑的東西）占用 3000／3306 的衝突。`nginx` 對外發布的主機 port 是 `8888`（容器內部監聽的仍是 80，`nginx.conf` 不用改），443 目前用不到（TLS 由 Cloudflare Tunnel 處理）。

> ⚠️ **前端不在本文件範圍內**：靜態前端頁面已改部署在其他平台（Vercel / Cloudflare Pages 等，平台預設網域），不再由這個 repo 的 nginx 服務。`Nginx/html/`、`Nginx/nginx.conf` 中原本服務 `zzowo.com` 靜態頁面的 server block 目前是**停用狀態**（保留但整段註解），為歷史遺留設定，僅供參考。前端實際部署位置與流程請見 [第 2 節](#2-主機與存取資訊)（待補）。

**網域與路由：**
- `cutefoodmap.zzowo.com/api/*` → nginx 反向代理至 `http://backend:3000/`

**對外連線方式：** 不直接對外開放主機 IP，透過 **Cloudflare Tunnel** 將流量導入 nginx。應用程式端已對應設定 `trust proxy` 層級以正確取得來源 IP（見 `Backend/app/app.js`）。cloudflared 的 tunnel 路由（Public Hostname 的 Service / origin URL）需綁定 `http://localhost:8888`，對應 nginx 目前對外發布的主機 port；若之後 `docker-compose.yml` 裡 nginx 的對外 port 再變動，這裡也要一併更新。

**請求流程：**
```
前端（外部平台，獨立部署）
      │  fetch /api/...
      ▼
Cloudflare Tunnel → nginx（容器內 80，主機對外 8888）→ cutefoodmap.zzowo.com/api/* → backend:3000 → mariadb:3306
```

**前端網域：** `https://cutefoodmap.vercel.app`（`nginx.conf` 中的 CORS 規則已對應此網域設定）

---

## 2. 主機與存取資訊

> ⚠️ 以下為交接時需要補齊的實際資訊，本文件先留下欄位骨架。

- **主機位置 / 供應商：** `[TODO: 請填入]`
- **SSH 連線方式（帳號、Port、金鑰位置）：** `[TODO: 請填入]`
- **Cloudflare Tunnel 設定：**
  - Tunnel 名稱 / ID：`[TODO: 請填入]`
  - `cloudflared` 設定檔位置：`[TODO: 請填入]`
  - 對應的 DNS 紀錄（`cutefoodmap.zzowo.com`）管理位置：`[TODO: 請填入，例如 Cloudflare Dashboard 帳號]`
  - `cloudflared` 是否也用 systemd / docker 常駐、如何重啟：`[TODO: 請填入]`
- **專案程式碼在主機上的路徑：** `[TODO: 請填入]`
- **前端（靜態頁面）部署位置：** Vercel，網域 `https://cutefoodmap.vercel.app`。部署帳號、對應的 Vercel 專案、觸發部署的方式（例如 push 到哪個分支自動部署）：`[TODO: 請填入]`

---

## 3. 前置需求

主機上需安裝：
- Docker Engine
- Docker Compose（v2，`docker compose` 子指令）
- Git

本機開發／手動執行資料匯入腳本時，額外需要：
- Node.js（版本需與 `Backend`／`DataBase` 相容，容器內使用 `node:22-alpine`）
- pnpm（`Backend/README.md`、`DataBase/README.md` 皆以 pnpm 安裝套件）

---

## 4. 環境變數與機密設定

專案中有三份機密／環境設定檔，皆已加入 `.gitignore`，**不會**進版控，僅存在於主機上：

| 檔案 | 用途 | 範本 |
|---|---|---|
| `docker-compose.yml` | 定義三個容器，含 MariaDB 帳密 | `docker-compose.example.yml` |
| `Backend/.env` | API 伺服器連線資料庫用的帳密、port | `Backend/.env_example` |
| `DataBase/.env` | 匯入資料腳本連線資料庫用 | `DataBase/.env_example` |

**機密存放與交接方式：** 密碼僅以明文存在主機上的上述檔案中，沒有額外的密碼管理工具。維運交接時請直接在主機上開啟這三個檔案查看目前設定，本文件不重複記錄實際密碼內容。若要輪替密碼，需同步更新 `docker-compose.yml`（MariaDB 環境變數）與 `Backend/.env`（`DB_PASSWORD`）並重啟對應容器（見 [第 8 節](#8-更新部署流程)）。

`Backend/.env` 主要欄位：

```
SERVICE_PORT=3000          # API 伺服器監聽 port
SERVICE_URL=http://yourdomain.com:3000   # Swagger UI 顯示用的網址
DB_HOST=mariadb             # 注意：docker-compose 網路內要用 service 名稱 "mariadb"，不是 localhost
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=cute_food_map
```

> ⚠️ 常見誤植：`.env_example` 範本預設 `DB_HOST=localhost`，那是給「不透過 docker-compose、直接在本機跑 backend」時用的。透過 `docker compose up` 啟動時，backend 容器要連到同網路內的 `mariadb` 容器，`DB_HOST` 必須設為 `mariadb`。

---

## 5. 首次部署流程

1. Clone 專案到主機：
   ```bash
   git clone git@github.com:[REDACTED]/Project-CF.git
   cd Project-CF
   ```
2. 建立 `docker-compose.yml`：
   ```bash
   cp docker-compose.example.yml docker-compose.yml
   ```
   編輯其中 MariaDB 的 `MYSQL_ROOT_PASSWORD` / `MYSQL_USER` / `MYSQL_PASSWORD` 為實際要使用的密碼。

   > ⚠️ 範本預設 `backend`（3000）、`mariadb`（3306）都會對外發布 port。若主機上這兩個 port 已經被其他服務占用（在共用主機上很常見），可以把該 service 的整個 `ports:` 區塊刪掉——`backend`、`mariadb` 只需要透過 `food_map` 內部網路互通，不對外發布也能正常運作。**注意：`ports:` 這個 key 底下不能留空**（例如只留一行註解），那是不合法的 YAML，`docker compose config` 會報 `ports must be a array`；要嘛保留至少一個對應，要嘛整個 `ports:` key 一起刪掉。
3. 建立 `Backend/.env`：
   ```bash
   cp Backend/.env_example Backend/.env
   ```
   依上一節說明填入資料庫連線資訊（`DB_HOST=mariadb`）與 `SERVICE_URL`。
4. 建立 `DataBase/.env`（供之後匯入資料使用）：
   ```bash
   cp DataBase/.env_example DataBase/.env
   ```
   `mariadb` 預設不對外發布 3306（見上方 ⚠️ 說明），所以匯入腳本**無法**直接在主機上跑並連到 `localhost:3306`。實際匯入方式見 [第 6 節](#6-資料庫初始化與資料匯入)。
5. 啟動所有容器：
   ```bash
   ./dockerComposeRun.sh
   ```
   （內容等同 `docker compose down && docker compose up -d`）
6. 驗證服務：
   ```bash
   docker compose ps                 # 三個容器皆為 Up
   curl http://localhost:8888/api/   # 透過 nginx 反代打到 backend，應回 "Success"
   ```
   （nginx 目前沒有服務靜態前端頁面，`curl http://localhost:8888/` 打根路徑預期是 404，屬正常現象，見第 1 節說明。`backend` 沒有對外發布 port，無法直接 `curl http://localhost:3000/`，要測 backend 本身可用 `docker exec backend wget -qO- http://localhost:3000/`）
   確認 backend 有成功連上資料庫，可用 `docker compose logs backend` 檢查是否出現 `Connected to the database`。
7. 若是全新資料庫，需接續 [第 6 節](#6-資料庫初始化與資料匯入) 建表與匯入資料。

---

## 6. 資料庫初始化與資料匯入

資料表結構定義於 `DataBase/SQL/create_tables.sql`（`Restaurants`、`Categories`、`RestaurantCategories`、`RestaurantHours` 四張表）。

**建表：**
```bash
docker exec -i mariadb mariadb -u root -p cute_food_map < DataBase/SQL/create_tables.sql
```
（會提示輸入 root 密碼，即 `docker-compose.yml` 中的 `MYSQL_ROOT_PASSWORD`）

**匯入 CSV 資料：**

`mariadb` 預設不對外發布 3306（見第 5 節 ⚠️ 說明），所以匯入腳本不能直接在主機上跑並連到 `localhost:3306`。有兩種作法，擇一：

- **方式 A（推薦，不需開 port）：** 用一個臨時容器跑匯入腳本，讓它透過 `food_map` 內部網路連 `mariadb`：
  ```bash
  cd DataBase
  # DataBase/.env 裡 DB_HOST 改成 mariadb（容器內部網路的服務名稱）
  docker run --rm --network cute_food_map_food_map \
    -v "$(pwd)":/app -w /app --env-file .env node:22-alpine \
    sh -c "npm install && npm run importR"
  docker run --rm --network cute_food_map_food_map \
    -v "$(pwd)":/app -w /app --env-file .env node:22-alpine \
    sh -c "npm run importRC"
  ```
  （network 名稱可用 `docker network ls` 確認，通常是 `<專案目錄名>_food_map`）
- **方式 B：** 在 `docker-compose.yml` 幫 `mariadb` 加回 `ports: ["3306:3306"]`（若主機 3306 沒被佔用）後 `docker compose up -d` 重建，`DataBase/.env` 的 `DB_HOST` 設 `127.0.0.1`，再直接於主機上 `pnpm install && pnpm importR && pnpm importRC`。

1. 將 CSV 檔放入 `DataBase/data/`（放置說明見該目錄下 `put_csv_file_here`）。
2. `package.json` 內的 script 對應：
   ```bash
   pnpm importR    # 匯入餐廳資料，對應 data/db_Restaurents.csv
   pnpm importRC   # 匯入餐廳類別關聯，對應 data/RestaurantCategories.csv
   ```
   （實際檔名以 `package.json` 內 script 定義為準，若 CSV 檔名不同需同步調整）

---

## 7. 日常維運指令

```bash
# 重啟全部容器（停止舊容器 + 重新建立）
./dockerComposeRun.sh

# 查看容器狀態
docker compose ps

# 即時查看某服務 log
docker compose logs -f backend
docker compose logs -f nginx
docker compose logs -f mariadb

# 進入容器除錯
docker exec -it backend sh
docker exec -it mariadb mariadb -u root -p
```

**Nginx log 位置：** 掛載在主機的 `Nginx/logs/`（JSON 格式，僅記錄非 2xx/3xx 的請求，見 `Nginx/nginx.conf` 內 `map $status $loggable`）。

---

## 8. 更新部署流程

程式碼更新（`git pull` 後）：

1. 於主機專案目錄拉取最新程式碼：
   ```bash
   git pull
   ```
2. **Backend** 程式碼是以 volume 方式掛載進容器（`./Backend/:/usr/src/app`），容器啟動指令為 `npm install && npm start`，因此重啟容器即可套用新程式碼與新套件：
   ```bash
   docker compose restart backend
   ```
3. **Nginx** 設定或靜態頁面若有變動（`Nginx/nginx.conf`、`Nginx/html/`），同樣是 volume 掛載，重啟即可生效：
   ```bash
   docker compose restart nginx
   ```
4. 若 `docker-compose.yml`（例如 MariaDB 版本）本身有變動，需要重新建立容器：
   ```bash
   ./dockerComposeRun.sh
   ```
5. 更新後照 [第 5 節步驟 6](#5-首次部署流程) 再次驗證服務正常。

> 注意：MariaDB 容器版本若升級，資料仍保留在 `db_data` volume 中，但跨大版本升級前建議先完成 [第 9 節](#9-資料庫備份與還原) 的備份。

> ⚠️ **前端更新不在這個流程裡**：前端部署在外部平台（見 [第 2 節](#2-主機與存取資訊)），程式碼更新、重新部署由該平台的流程處理，跟這裡的 `docker compose` 操作無關。

---

## 9. 資料庫備份與還原

**備份（mariadb-dump）：**
```bash
docker exec mariadb sh -c 'mariadb-dump -u root -p"$MYSQL_ROOT_PASSWORD" cute_food_map' > backup_$(date +%Y%m%d).sql
```

**還原：**
```bash
docker exec -i mariadb mariadb -u root -p cute_food_map < backup_20260101.sql
```

**備份整個資料 volume（含所有資料庫檔案，適合完整搬遷或災難復原）：**
```bash
docker run --rm -v cute_food_map_db_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/db_data_backup_$(date +%Y%m%d).tar.gz -C /data .
```
（volume 實際名稱可用 `docker volume ls` 確認，通常是 `<專案目錄名>_db_data`）

建議：正式站應設定排程（如 cron）定期執行 mariadb-dump 備份，並將備份檔案異地保存。

---

## 10. 緊急回滾與復原

**程式碼／設定回滾：**
```bash
git log --oneline          # 找到要回滾的 commit
git checkout <commit-hash> -- Backend/ Nginx/nginx.conf
docker compose restart backend nginx
```
確認穩定後再視情況建立正式的 revert commit。

**容器起不來時的排查順序：**
1. `docker compose ps` 確認哪個容器沒有 Up
2. `docker compose logs <service>` 看錯誤訊息
3. 檢查對應的 `.env` / `docker-compose.yml` 是否有誤（常見：密碼打錯、`DB_HOST` 設成 `localhost`）
4. 檢查 port 是否被佔用：`sudo lsof -i :8888`（`backend`、`mariadb` 若沒對外發布 port 則不用檢查 3000/3306）
5. 檢查 volume 掛載路徑權限問題（尤其 `Nginx/logs`、`Nginx/ssl`）

**資料庫損毀：** 依 [第 9 節](#9-資料庫備份與還原) 的備份還原。

---

## 11. 疑難排解 FAQ

**Q：前端呼叫 API 出現 CORS 錯誤**
檢查 `Nginx/nginx.conf` 中 `cutefoodmap.zzowo.com` server block 的 origin 判斷式：
```
if ($http_origin ~* (^https://cutefoodmap\.vercel\.app$))
```
只有 `https://cutefoodmap.vercel.app` 這個確切來源會被放行。若前端網域之後變動（例如改用自訂網域，或啟用 Vercel 的 preview deployment 網域），這條規則需要同步更新，改完 `docker compose restart nginx` 生效。另外 backend 本身也有 `cors` middleware（`Backend/app/utils/middleware.js`），兩處設定需一致檢查。

**Q：backend 連不上資料庫（`ECONNREFUSED` 或 `Connected to the database` 沒出現）**
- 確認 `Backend/.env` 的 `DB_HOST` 是 `mariadb`（容器名稱），不是 `localhost`
- 確認 `mariadb` 容器已啟動且 healthy：`docker compose logs mariadb`
- 確認帳密與 `docker-compose.yml` 中 MariaDB 環境變數一致

**Q：port 衝突，容器起不來**
主機上 8888 需未被其他服務佔用，用 `lsof -i :8888` 檢查。`backend`（3000）、`mariadb`（3306）預設不對外發布 port，只在 `food_map` 內部網路溝通，不會佔用主機這兩個 port；如果 `docker-compose.yml` 裡有把它們的 `ports:` 打開，才需要額外檢查 3000／3306 是否被主機上其他服務占用（在共用主機上很常見，例如已經有別的服務用掉這些 port）。

**Q：Cloudflare Tunnel 打進來變成 502**
確認 nginx 本身沒問題：`curl http://localhost:8888/api/` 應該要回 `Success`。如果本機測試正常但透過 tunnel 網域打進來是 502，通常是 `cloudflared` 容器/程序連不到 nginx：
- 若 `cloudflared` 是跑在**獨立的 docker 容器**裡（用 `docker ps` 確認），它預設在自己的 network namespace，跟這個專案的 `food_map` network 是分開的，即使 nginx 本身正常，`cloudflared` 也連不到 `localhost` 或 `nginx` 這個名稱。需要把 `cloudflared` 容器加入 `food_map` network（`docker network connect food_map <cloudflared容器名稱>`），並在 Cloudflare Zero Trust Dashboard 的 Public Hostname 設定裡把 origin service URL 改成 `http://nginx:80`。
- 若 `cloudflared` 是用 token 方式啟動（`cloudflared tunnel run --token ...`），Public Hostname → origin 的對應是設定在 Cloudflare Dashboard 上，不是本機設定檔，需要登入 Dashboard 確認/修改。

**Q：改了 `Nginx/nginx.conf` 沒生效**
確認執行了 `docker compose restart nginx`，並用 `docker exec nginx nginx -t` 檢查設定檔語法是否正確。

---

## 12. 安全性注意事項

- `docker-compose.yml`、`Backend/.env`、`DataBase/.env` 皆已列入 `.gitignore`，**切勿**移除 gitignore 規則或手動 commit 這些檔案。
- 各 `.env_example` / `docker-compose.example.yml` 僅供參考，內含的帳密只能是佔位符，不可填入真實密碼後提交。
- 目前密碼僅以明文存放在主機檔案中，交接或懷疑外洩時應立即輪替 MariaDB 密碼（`docker-compose.yml`、`Backend/.env` 需同步更新）。
- 主機存取（SSH 金鑰、Cloudflare Tunnel 憑證）僅限授權維運人員持有，人員異動時應撤銷舊金鑰／重新產生 Tunnel 憑證。
- `docker-compose.yml` 中 `./Nginx/ssl:/etc/nginx/ssl` 的掛載目前是歷史遺留、實際未使用（`nginx.conf` 已移除對應的 `ssl_certificate` 指令，TLS 由 Cloudflare Tunnel 處理），可以之後一併清掉，不影響現有部署。
