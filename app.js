const express = require('express');
const app = express();
const path = require('path');
const db = require('./db');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 3001;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', async (req, res) => {
  const { userID, password } = req.body;

  try {
    const [results] = await db.execute('SELECT * FROM Employee WHERE EmpID = ? AND Password = ?', [userID, password]);

    if (results.length === 0) {
      return res.status(401).send('Unauthorized'); // User not found or invalid credentials
    }

    const user = results[0];
    let redirectUrl;

    if (user.Administration === 1) {
      redirectUrl = '/adminHome.html';
    } else if (user.Job === 'radiologist') {
      redirectUrl = '/radiologistHome.html';
    } else {
      redirectUrl = '/staffHome.html';
    }

    res.redirect(redirectUrl); // Redirect the user to the appropriate interface
  } catch (error) {
    console.error('Error checking credentials:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
