require("dotenv").config(); // 引入 dotenv 套件
const express = require("express"); // 引入express套件
const bodyParser = require("body-parser"); // 引入body-parser套件
const restaurantController = require("./controllers/restaurantController");
const { initSwagger } = require("./config/swaggerConfig"); // 引入 Swagger 設定
const cors = require("cors"); // 引入 cors 套件
const { corsOptions, limiter, handleExit } = require("./utils/middleware"); // 引入獨立模組
const Log = require("./utils/log");
const app = express(); // 創建express應用程式

// 使用 CORS 中介軟體
app.use(cors(corsOptions));

// 初始化 Swagger
initSwagger(app);

// 設定速率限制
app.use(limiter);

// 設定body-parser
app.use(bodyParser.json());

// 路由設定
app.get("/", (req, res) => {
	// 用於測試伺服器是否正常運作
	res.send("Success");
});
app.use("/api/v1/restaurants", restaurantController);

// 啟動api伺服器
const PORT = process.env.SERVICE_PORT || 3000;
const server = app.listen(PORT, () => {
	Log.info(`Server running on port ${PORT}`);
});

// 處理正常結束
process.on("SIGTERM", () => handleExit(server, "Process terminated"));

// 處理 Ctrl+C
process.on("SIGINT", () => handleExit(server, "Process interrupted"));
