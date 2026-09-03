require("dotenv").config();
const mariadb = require("mariadb");

// MariaDB connection pool
const pool = mariadb.createPool({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	connectionLimit: 10,
});

// 需與 import_RestaurantCategories.js 中的 categoryMapping 保持一致
const categories = [
	{ id: 1, name: "中式" },
	{ id: 2, name: "西式" },
	{ id: 3, name: "日式" },
	{ id: 4, name: "美式" },
	{ id: 5, name: "東南亞" },
	{ id: 6, name: "飲品" },
	{ id: 7, name: "其他" },
];

seedCategories();

async function seedCategories() {
	console.log("Starting Categories seed...");
	let connection;
	try {
		connection = await pool.getConnection();
		console.log("Connection acquired from the pool.");

		const query = `
            INSERT INTO Categories (id, name)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE name = VALUES(name)
        `;

		for (const category of categories) {
			console.log(`Upserting category: ${JSON.stringify(category)}`);
			await connection.query(query, [category.id, category.name]);
		}
		console.log("Categories seed successful!");
	} catch (err) {
		console.error("Error occurred during Categories seed:", err);
	} finally {
		if (connection) connection.release();
		console.log("Connection released.");
		process.exit(0);
	}
}
