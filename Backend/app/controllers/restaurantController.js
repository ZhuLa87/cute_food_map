const express = require("express");
const router = express.Router();
const restaurantService = require("../services/restaurantService");
const Log = require("../utils/log");

/**
 * 獲取所有餐廳
 * @returns {array} 餐廳物件陣列
 * @throws {Error} 無法獲取餐廳
 */
router.get("/", async (req, res) => {
	try {
		const restaurants = await restaurantService.getAllRestaurants();
		Log.info(`Fetched all restaurants from IP: ${req.ip}`);
		res.status(200).json(restaurants);
	} catch (err) {
		Log.error(`Error fetching restaurants from IP: ${req.ip}\n${err}`);
		res.status(500).json({ message: "Error fetching restaurants" });
	}
});

/**
 * 獲取所有餐廳的所有資料
 * @returns {array} 餐廳物件陣列
 * @throws {Error} 無法獲取餐廳資料
 */
router.get("/all", async (req, res) => {
	try {
		const restaurants = await restaurantService.getAllRestaurantData();
		Log.info(`Fetched all restaurant data from IP: ${req.ip}`);
		res.status(200).json(restaurants);
	} catch (err) {
		Log.error(`Error fetching all restaurant data from IP: ${req.ip}\n${err}`);
		res.status(500).json({ message: "Error fetching all restaurant data" });
	}
});

/**
 * 根據特定條件查詢餐廳
 * @param {object} criteria - 查詢條件
 * @returns {array} 餐廳物件陣列
 * @throws {Error} 無法獲取餐廳
 */
router.get("/search", async (req, res) => {
	try {
		const criteria = {
			eat_in: req.query.eat_in,
			takeaway: req.query.takeaway,
			category_ids: Array.isArray(req.query.category_id)
				? req.query.category_id.map((id) => id.trim())
				: req.query.category_id
				? [req.query.category_id.trim()]
				: [],
			price_range: Array.isArray(req.query.price_range)
				? req.query.price_range.map((range) => range.trim())
				: req.query.price_range
				? [req.query.price_range.trim()]
				: [],
			has_vegetarian: req.query.has_vegetarian,
			dayOfWeek: req.query.dayOfWeek,
			time: req.query.time
				? `${req.query.time.slice(0, 2)}:${req.query.time.slice(2, 4)}:00`
				: undefined,
		};

		const restaurants = await restaurantService.getFilteredRestaurants(
			criteria
		);

		Log.info(`Fetched restaurants by criteria from IP: ${req.ip}`);
		res.status(200).json(restaurants);
	} catch (err) {
		Log.error(
			`Error fetching restaurants by criteria from IP: ${req.ip}\n${err}`
		);
		res.status(500).json({ message: "Error fetching restaurants by criteria" });
	}
});

/**
 * 根據特定時間查詢開放的餐廳
 * @param {string} dayOfWeek - 星期幾
 * @param {string} time - 時間 (格式: HHMM)
 * @returns {array} 餐廳物件陣列
 * @throws {Error} 無法獲取餐廳
 */
router.get("/open", async (req, res) => {
	const { dayOfWeek, time } = req.query;
	if (!/^[1-7]$/.test(dayOfWeek) || !/^\d{4}$/.test(time)) {
		return res
			.status(400)
			.json({ message: "Invalid dayOfWeek or time format" });
	}
	const formattedTime = `${time.slice(0, 2)}:${time.slice(2, 4)}:00`;
	try {
		const restaurants = await restaurantService.getOpenRestaurantsByTime(
			dayOfWeek,
			formattedTime
		);
		Log.info(
			`Fetched open restaurants for day ${dayOfWeek} and time ${formattedTime} from IP: ${req.ip}`
		);
		res.status(200).json(restaurants);
	} catch (err) {
		Log.error(
			`Error fetching open restaurants for day ${dayOfWeek} and time ${formattedTime} from IP: ${req.ip}\n${err}`
		);
		res.status(500).json({ message: "Error fetching open restaurants" });
	}
});

/**
 * 獲取指定餐廳
 * @param {string} id - 餐廳ID
 * @returns {object} 餐廳物件
 * @throws {Error} 餐廳不存在
 */
router.get("/:id", async (req, res) => {
	const id = req.params.id;
	if (!/^\d+$/.test(id)) {
		return res.status(400).json({ message: "Invalid restaurant ID format" });
	}
	try {
		const restaurant = await restaurantService.getRestaurantById(id);
		Log.info(`Fetched restaurant ${req.params.id} from IP: ${req.ip}`);
		res.status(200).json(restaurant);
	} catch (err) {
		Log.error(
			`Error fetching restaurant ${req.params.id} from IP: ${req.ip}\n${err}`
		);
		res
			.status(500)
			.json({ message: `Error fetching restaurant ${req.params.id}` });
	}
});

/**
 * 獲取指定餐廳的類別
 * @param {string} id - 餐廳ID
 * @returns {array} 餐廳類別物件陣列
 * @throws {Error} 餐廳類別不存在
 */
router.get("/:id/categories", async (req, res) => {
	const id = req.params.id;
	if (!/^\d+$/.test(id)) {
		return res.status(400).json({ message: "Invalid restaurant ID format" });
	}
	try {
		const categories = await restaurantService.getCategoriesByRestaurantId(id);
		Log.info(
			`Fetched categories for restaurant ${req.params.id} from IP: ${req.ip}`
		);
		res.status(200).json(categories);
	} catch (err) {
		Log.error(
			`Error fetching categories for restaurant ${req.params.id} from IP: ${req.ip}\n${err}`
		);
		res.status(500).json({
			message: `Error fetching categories for restaurant ${req.params.id}`,
		});
	}
});

/**
 * 獲取指定餐廳的營業時間
 * @param {string} id - 餐廳ID
 * @returns {array} 餐廳營業時間物件陣列
 * @throws {Error} 無法獲取營業時間
 */
router.get("/:id/hours", async (req, res) => {
	const id = req.params.id;
	if (!/^\d+$/.test(id)) {
		return res.status(400).json({ message: "Invalid restaurant ID format" });
	}
	try {
		const hours = await restaurantService.getRestaurantHoursById(id);
		Log.info(`Fetched hours for restaurant ${id} from IP: ${req.ip}`);
		res.status(200).json(hours);
	} catch (err) {
		Log.error(
			`Error fetching hours for restaurant ${id} from IP: ${req.ip}\n${err}`
		);
		res.status(500).json({ message: "Error fetching restaurant hours" });
	}
});

/**
 * 新增完整餐廳資料
 * @param {object} restaurant - 餐廳資料
 * @returns {object} 新增的餐廳物件
 * @throws {Error} 無法新增餐廳
 */
router.post("/", async (req, res) => {
	try {
		const restaurant = req.body;
		const newRestaurant = await restaurantService.addCompleteRestaurant(
			restaurant
		);
		Log.info(`Added new restaurant from IP: ${req.ip}`);
		res.status(201).json(newRestaurant);
	} catch (err) {
		Log.error(`Error adding restaurant from IP: ${req.ip}\n${err}`);
		Log.error(err);
		res.status(500).json({ message: "Error adding restaurant" });
	}
});

module.exports = router;
