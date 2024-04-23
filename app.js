const express = require('express');
const app = express();
const path = require('path');
const db = require('./db');
const PORT = process.env.PORT || 3001;


// Example route to test the database connection
app.get('/', async (req, res) => {
  try {
    // Get a connection from the pool
    const connection = await db.getConnection();

    // Perform a query
    const [rows, fields] = await connection.execute('SELECT * FROM your_table');

    // Release the connection back to the pool
    connection.release();

    res.json({ rows });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
