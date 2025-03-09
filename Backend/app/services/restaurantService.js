const db = require("../config/dbConfig");

exports.getAllRestaurants = async () => {
	const rows = await db.query("SELECT * FROM Restaurants");
	return rows;
};

exports.getRestaurantById = async (id) => {
	const rows = await db.query(
		`SELECT r.*,
		        JSON_ARRAYAGG(DISTINCT c.name) AS categories,
		        JSON_ARRAYAGG(JSON_OBJECT('day_of_week', rh.day_of_week, 'start_time', rh.start_time, 'end_time', rh.end_time, 'is_overnight', rh.is_overnight)) AS hours
		 FROM Restaurants r
		 LEFT JOIN RestaurantCategories rc ON r.id = rc.restaurant_id
		 LEFT JOIN Categories c ON rc.category_id = c.id
		 LEFT JOIN RestaurantHours rh ON r.id = rh.restaurant_id
		 WHERE r.id = ?
		 GROUP BY r.id`,
		[id]
	);
	if (rows.length === 0) {
		throw new Error("Restaurant not found");
	}
	return rows[0];
};

exports.getCategoriesByRestaurantId = async (restaurantId) => {
	const rows = await db.query(
		`SELECT c.id, c.name
		 FROM RestaurantCategories rc
		 JOIN Categories c ON rc.category_id = c.id
		 WHERE rc.restaurant_id = ?`,
		[restaurantId]
	);
	if (rows.length === 0) {
		throw new Error("Categories not found for the restaurant");
	}
	return rows;
};

exports.getFilteredRestaurants = async (criteria) => {
	let query = `
		SELECT r.*,
		       JSON_ARRAYAGG(DISTINCT c.name) AS categories,
		       JSON_ARRAYAGG(JSON_OBJECT('day_of_week', rh.day_of_week, 'start_time', rh.start_time, 'end_time', rh.end_time, 'is_overnight', rh.is_overnight)) AS hours
		FROM Restaurants r
		LEFT JOIN RestaurantCategories rc ON r.id = rc.restaurant_id
		LEFT JOIN Categories c ON rc.category_id = c.id
		LEFT JOIN RestaurantHours rh ON r.id = rh.restaurant_id
		WHERE 1=1`;
	let params = [];

	if (criteria.eat_in !== undefined) {
		query += " AND r.eat_in = ?";
		params.push(criteria.eat_in == 1 ? 1 : 0);
	}
	if (criteria.takeaway !== undefined) {
		query += " AND r.takeaway = ?";
		params.push(criteria.takeaway == 1 ? 1 : 0);
	}
	if (criteria.category_ids && criteria.category_ids.length > 0) {
		const placeholders = criteria.category_ids.map(() => "?").join(",");
		query += ` AND r.id IN (SELECT restaurant_id FROM RestaurantCategories WHERE category_id IN (${placeholders}))`;
		params.push(...criteria.category_ids);
	}
	if (criteria.price_range && criteria.price_range.length > 0) {
		const placeholders = criteria.price_range.map(() => "?").join(",");
		query += ` AND r.price_range IN (${placeholders})`;
		params.push(...criteria.price_range);
	}
	if (criteria.has_vegetarian !== undefined) {
		query += " AND r.has_vegetarian = ?";
		params.push(criteria.has_vegetarian == 1 ? 1 : 0);
	}
	if (criteria.dayOfWeek && criteria.time) {
		query += ` AND ((rh.day_of_week = ? AND rh.start_time <= ? AND rh.end_time >= ?)
			OR (rh.day_of_week = ? AND rh.is_overnight = 1 AND rh.start_time <= ?))`;
		params.push(
			criteria.dayOfWeek,
			criteria.time,
			criteria.time,
			(criteria.dayOfWeek % 7) + 1,
			criteria.time
		);
	}

	query += " GROUP BY r.id HAVING JSON_LENGTH(hours) > 0";

	const rows = await db.query(query, params);
	return rows;
};

exports.getRestaurantHoursById = async (restaurantId) => {
	const rows = await db.query(
		`SELECT day_of_week, start_time, end_time, is_overnight
		 FROM RestaurantHours
		 WHERE restaurant_id = ?`,
		[restaurantId]
	);
	if (rows.length === 0) {
		throw new Error("Hours not found for the restaurant");
	}
	return rows;
};

exports.getAllRestaurantData = async () => {
	const rows = await db.query(`
		SELECT r.*,
		       JSON_ARRAYAGG(DISTINCT c.name) AS categories,
		       JSON_ARRAYAGG(JSON_OBJECT('day_of_week', rh.day_of_week, 'start_time', rh.start_time, 'end_time', rh.end_time, 'is_overnight', rh.is_overnight)) AS hours
		FROM Restaurants r
		LEFT JOIN RestaurantCategories rc ON r.id = rc.restaurant_id
		LEFT JOIN Categories c ON rc.category_id = c.id
		LEFT JOIN RestaurantHours rh ON r.id = rh.restaurant_id
		GROUP BY r.id
	`);
	return rows;
};

exports.getOpenRestaurantsByTime = async (dayOfWeek, time) => {
	const rows = await db.query(
		`SELECT r.*,
               JSON_ARRAYAGG(DISTINCT c.name) AS categories,
               JSON_ARRAYAGG(DISTINCT JSON_OBJECT('day_of_week', rh.day_of_week, 'start_time', rh.start_time, 'end_time', rh.end_time, 'is_overnight', rh.is_overnight)) AS hours
         FROM Restaurants r
         LEFT JOIN RestaurantCategories rc ON r.id = rc.restaurant_id
         LEFT JOIN Categories c ON rc.category_id = c.id
         LEFT JOIN RestaurantHours rh ON r.id = rh.restaurant_id
         WHERE (rh.day_of_week = ? AND rh.start_time <= ? AND rh.end_time >= ?)
            OR (rh.day_of_week = ? AND rh.is_overnight = 1 AND rh.start_time <= ?)
         GROUP BY r.id`,
		[dayOfWeek, time, time, (dayOfWeek % 7) + 1, time]
	);
	return rows;
};
