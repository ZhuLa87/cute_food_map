const rateLimit = require("express-rate-limit");
const Log = require("./log");

// 速率限制設定
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 分鐘
	max: 100, // 每個 IP 最多 100 次請求
	handler: (req, res) => {
		// 自訂回應內容
		res.status(429).json({
			message: "Too many requests, please try again later.",
		});
	},
});

// 處理退出邏輯
const handleExit = (server, message) => {
	server.close(() => {
		Log.info(message);
		process.exit(0);
	});
};

module.exports = {
	corsOptions,
	limiter,
	handleExit,
};
