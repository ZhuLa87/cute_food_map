# Cute Food Map DataBase

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

## 建立 Categories 種子資料

`RestaurantCategories` 表透過外鍵參照 `Categories` 表，因此在匯入餐廳分類資料之前，
必須先確保 `Categories` 表已有對應的分類資料，否則會出現以下錯誤：

```
Cannot add or update a child row: a foreign key constraint fails
(`cute_food_map`.`RestaurantCategories`, CONSTRAINT `RestaurantCategories_ibfk_2`
FOREIGN KEY (`category_id`) REFERENCES `Categories` (`id`))
```

執行以下指令寫入（或更新）分類種子資料（中式、西式、日式、美式、東南亞、飲品、其他）：

```bash
pnpm run seedCategories
```

此指令為 idempotent（可重複執行），已存在的分類資料不會重複新增。若日後在
`import_RestaurantCategories.js` 的 `categoryMapping` 中新增或修改分類，
請同步更新 `seed_Categories.js` 中的 `categories` 清單，確保兩者的 id 對應一致。

## 從 CSV 匯入資料

1. 安裝依賴

   ```
    pnpm install
   ```

2. 建立資料庫結構後，先執行 `pnpm run seedCategories` 建立分類種子資料（見上一節）。

3. 執行以下指令來匯入餐廳資料：

   ```bash
   pnpm run importR
   ```

   或指定其他 CSV 檔案路徑：

   ```bash
   node import_Restaurents.js <CSV 檔案路徑>
   ```

4. 執行以下指令來匯入餐廳與分類的關聯資料：

   ```bash
   pnpm run importRC
   ```

   或指定其他 CSV 檔案路徑：

   ```bash
   node import_RestaurantCategories.js <CSV 檔案路徑>
   ```

5. 匯入成功後，資料將會存入資料庫中。

## 注意事項

- 請確保 CSV 檔案的格式正確，並包含必要的欄位。
- 匯入 `RestaurantCategories` 前，請先確認 `Categories` 表已有資料（執行 `pnpm run seedCategories`）。
- 匯入過程中若發生錯誤，請檢查環境變數設定及資料庫連線狀態。
