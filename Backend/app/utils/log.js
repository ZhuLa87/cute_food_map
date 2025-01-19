class Log {
	static getTimeStamp() {
		return new Date().toISOString();
	}

	static info(message) {
		console.log(`\x1b[34m[INFO] [${this.getTimeStamp()}] ${message}\x1b[0m`);
	}

	static warn(message) {
		console.warn(`\x1b[33m[WARN] [${this.getTimeStamp()}] ${message}\x1b[0m`);
	}

	static error(message) {
		console.error(`\x1b[31m[ERROR] [${this.getTimeStamp()}] ${message}\x1b[0m`);
	}
}

module.exports = Log;
