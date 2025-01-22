require("dotenv").config(); // 引入 dotenv 套件
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerDocument = require("./swagger.json");

// 動態設置 servers 資料
if (process.env.SERVICE_URL) {
	swaggerDocument.servers[0].url = `${process.env.SERVICE_URL}`;
	swaggerDocument.servers[0].variables = {};
}

const swaggerOptions = {
	swaggerDefinition: swaggerDocument,
	apis: ["../controllers/*.js"], // 指定 API 文件的位置
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

const initSwagger = (app) => {
	app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};

module.exports = { initSwagger };
