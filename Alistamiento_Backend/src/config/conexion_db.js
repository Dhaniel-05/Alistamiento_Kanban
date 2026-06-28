const mysql = require('mysql2/promise');
const config = require('./env');

const db = mysql.createPool({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
});

module.exports = db;