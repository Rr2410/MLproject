// db.js
const mysql = require('mysql2');

// Create a connection pool
const pool = mysql.createPool({
  host: 'mysql-22ed2874-rr456aa-117e.f.aivencloud.com',
  user: 'avnadmin',
  password: 'AVNS_S2185k_gM0yQwl1y07K',
  database: 'defaultdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Export the pool
module.exports = pool.promise();
