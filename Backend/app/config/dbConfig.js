require("dotenv").config();
const mariadb = require("mariadb");
const Log = require("../utils/log");

const db = mariadb.createPool({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	connectionLimit: 5, // 設定連線池的連線數量限制
});

db.getConnection()
	.then((connection) => {
		Log.info("Connected to the database");
		connection.release(); // 釋放連線回連線池
	})
	.catch((err) => {
		console.error("Error connecting to database:", err.stack);
	});

// 添加伺服器中斷的處理
db.on("error", (err) => {
	if (err.code === "PROTOCOL_CONNECTION_LOST") {
		Log.error("Database connection was closed.");
	} else if (err.code === "ER_CON_COUNT_ERROR") {
		Log.error("Database has too many connections.");
	} else if (err.code === "ECONNREFUSED") {
		Log.error("Database connection was refused.");
	} else {
		Log.error("Database error:", err);
	}
});

module.exports = db;
