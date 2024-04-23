// db.js
const mysql = require('mysql2');

// Create a connection pool
const pool = mysql.createPool({
  host: 'your_database_host',
  user: 'your_database_user',
  password: 'your_database_password',
  database: 'your_database_name',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Export the pool
module.exports = pool.promise();
