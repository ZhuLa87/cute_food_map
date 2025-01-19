require("dotenv").config();
const fs = require("fs");
const csv = require("csv-parser");
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

const filePath = process.argv[2];
if (!filePath) {
	console.error("Please provide the path to the CSV file to import");
	process.exit(1);
}

importCSV(filePath);

async function importCSV(filePath) {
	console.log(`Starting import for file: ${filePath}`);
	let connection;
	try {
		console.log("Attempting to get a connection from the pool...");
		connection = await pool.getConnection();
		console.log("Connection acquired from the pool.");
		const data = [];
		// Parse CSV
		fs.createReadStream(filePath)
			.pipe(csv())
			.on("data", (row) => {
				console.log(`Processing row: ${JSON.stringify(row)}`);
				const [latitude, longitude] = row["經緯度"].split(", ");
				data.push([
					null, // id auto-increment
					row["店名"],
					row["地址"] || null, // 處理地址可能為空值的問題
					parseFloat(latitude),
					parseFloat(longitude),
					row["內用/外帶"].includes("內用") ? 1 : 0,
					row["內用/外帶"].includes("外帶") ? 1 : 0,
					row["價格區間"] === "100以下"
						? 1
						: row["價格區間"] === "100-200"
						? 2
						: 3,
					row["葷素"].includes("素食") ? 1 : 0,
					row["菜單"] || null, // 處理菜單可能為空值的問題
				]);
			})
			.on("end", async () => {
				console.log("CSV reading completed, starting data import...");
				const query = `
                    INSERT INTO Restaurants (id, name, address, latitude, longitude, eat_in, takeaway, price_range, has_vegetarian, menu)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
				try {
					for (const row of data) {
						console.log(`Inserting row: ${JSON.stringify(row)}`);
						await connection.query(query, row);
					}
					console.log("Data import successful!");
				} catch (err) {
					console.error("Error occurred during data import:", err);
				} finally {
					connection.release();
					console.log("Connection released.");
					process.exit(0);
				}
			});
	} catch (err) {
		console.error("Import failed:", err);
		if (connection) connection.release();
	}
}
