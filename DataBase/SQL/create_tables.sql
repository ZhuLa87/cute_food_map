-- Select the database to use
USE `cute_food_map`;

-- Restaurants definition
CREATE TABLE `Restaurants` (
  `id` int(12) unsigned NOT NULL AUTO_INCREMENT COMMENT '餐廳唯一識別碼',
  `name` varchar(255) NOT NULL COMMENT '餐廳名稱',
  `address` text DEFAULT NULL COMMENT '餐廳地址',
  `latitude` decimal(18, 15) NOT NULL COMMENT '餐廳緯度',
  `longitude` decimal(18, 15) NOT NULL COMMENT '餐廳經度',
  `eat_in` tinyint(1) DEFAULT NULL COMMENT '內用 (1: 是, 0: 否)',
  `takeaway` tinyint(1) DEFAULT NULL COMMENT '外帶 (1: 是, 0: 否)',
  `price_range` tinyint(1) DEFAULT NULL COMMENT '價格區間 (1:100以下, 2: 100-200, 3: 200以上)',
  `has_vegetarian` tinyint(1) DEFAULT NULL COMMENT '是否提供素食',
  `menu` varchar(500) DEFAULT NULL COMMENT '餐廳菜單圖片連結編號',
  PRIMARY KEY (`id`),
  INDEX `idx_lat_lng` (`latitude`, `longitude`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='餐廳基本資訊';

-- Categories definition
CREATE TABLE `Categories` (
  `id` int(3) unsigned NOT NULL AUTO_INCREMENT COMMENT '類別唯一識別碼',
  `name` VARCHAR(30) NOT NULL COMMENT '類別名稱',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='餐廳類別資訊';

-- RestaurantCategories definition
CREATE TABLE `RestaurantCategories` (
  `id` int(12) unsigned NOT NULL AUTO_INCREMENT COMMENT '餐廳類別關聯唯一識別碼',
  `restaurant_id` int(12) unsigned NOT NULL COMMENT '關聯的餐廳 ID',
  `category_id` int(3) unsigned NOT NULL COMMENT '關聯的類別 ID',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`restaurant_id`) REFERENCES `Restaurants`(`id`),
  FOREIGN KEY (`category_id`) REFERENCES `Categories`(`id`),
  INDEX `idx_restaurant_category` (`restaurant_id`, `category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='餐廳與類別的關聯資訊';

-- restaurant_hours definition
CREATE TABLE `RestaurantHours` (
  `id` int(12) unsigned NOT NULL AUTO_INCREMENT COMMENT '餐廳營業時間唯一識別碼',
  `restaurant_id` int(12) unsigned NOT NULL COMMENT '關聯的餐廳 ID',
  `day_of_week` tinyint(1) NOT NULL COMMENT '星期幾 (1: 星期一, 2: 星期二, ..., 7: 星期日)',
  `start_time` time NOT NULL COMMENT '營業開始時間 (格式: HH:MM:SS)',
  `end_time` time NOT NULL COMMENT '營業結束時間 (格式: HH:MM:SS)',
  `is_overnight` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否跨夜營業 (1: 是, 0: 否)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `restaurant_hours_unique` (`restaurant_id`,`day_of_week`,`start_time`,`end_time`),
  FOREIGN KEY (`restaurant_id`) REFERENCES `Restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='餐廳營業時間資訊';
