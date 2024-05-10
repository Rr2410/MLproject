const { mod } = require('@tensorflow/tfjs-node');
const mysql = require('mysql2');
const fs = require('fs');

// Create a connection pool
const pool = mysql.createPool({
  host: 'mysql-22ed2874-rr456aa-117e.f.aivencloud.com',
  user: 'avnadmin',
  password: 'AVNS_S2185k_gM0yQwl1y07K',
  database: 'defaultdb',
  port: 22562,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    ca: fs.readFileSync('/Users/renada/Downloads/ca.pem'),
  },
});

// Export the pool
module.exports = pool.promise();
