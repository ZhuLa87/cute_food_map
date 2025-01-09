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

// Category mapping
const categoryMapping = {
    "中式": 1,
    "西式": 2,
    "日式": 3,
    "美式": 4,
    "東南亞": 5,
    "飲品": 6,
    "其他": 7,
};

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

                const categories = row["類別"].split(", "); // Split categories if multiple
                for (const category of categories)
                {
                    const categoryId = categoryMapping[category];
                    if (categoryId === undefined) {
                        console.error(`Unknown category: ${category}`);
                        connection.release(); // Release the connection
                        process.exit(1); // Exit on unknown category
                    }
                    data.push([
                        null, // id auto-increment
                        parseInt(row["restaurant_id"]),
                        categoryId
                    ]);
                }
            })
            .on("end", async () => {
                console.log("CSV reading completed, starting data import...");
                const query = `
                    INSERT INTO RestaurantCategories (id, restaurant_id, category_id)
                    VALUES (?, ?, ?)
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
