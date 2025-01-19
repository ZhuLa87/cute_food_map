# Project-CF DataBase

建立一個餐廳資料庫，並從 CSV 檔案匯入餐廳資料。本範例使用 MariaDB。

## 環境變數設定

在專案根目錄下複製 `.env_example` 並重新命名為 `.env` ，並設定以下環境變數：

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=food_map_db
```

## 資料庫結構

參考 `create_tables.sql` 檔案來建立資料庫結構。

## 從 CSV 匯入資料

1. 安裝依賴

   ```
    pnpm install
   ```

2. 執行以下指令來匯入 CSV 資料：

   ```bash
   node import_data.js <CSV 檔案路徑>
   ```

   例如：

   ```bash
   node import_data.js data/restaurants.csv
   ```

3. 匯入成功後，資料將會存入資料庫中。

## 注意事項

- 請確保 CSV 檔案的格式正確，並包含必要的欄位。
- 匯入過程中若發生錯誤，請檢查環境變數設定及資料庫連線狀態。
