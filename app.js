const express = require('express');
const app = express();
const path = require('path');
const db = require('./db');
const bodyParser = require('body-parser');
const ort = require('onnxruntime-web');



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
    } else if (user.Job === 'Radiologist') {
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


//display patient data
app.get('/data', async (req, res) => {
  const { offset, limit } = req.query;

  console.log('Offset:', offset);
  console.log('Limit:', limit);

  try {
    const [results] = await db.execute(`SELECT PatientID, FirstName, LastName, Gender, MedicalHistory, ImageProcessingHistory, responsibleEmpId FROM Patients LIMIT ${parseInt(offset)}, ${parseInt(limit)}`);
    res.json(results);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//searching in patient table
app.get('/data', async (req, res) => {
  const { offset, limit, search } = req.query;

  console.log('Offset:', offset);
  console.log('Limit:', limit);
  console.log('Search:', search);

  let query = 'SELECT PatientID, FirstName, LastName, Gender, MedicalHistory, ImageProcessingHistory, responsibleEmpId FROM Patients';
  let params = [];

  if (search) {
    query += ' WHERE PatientID LIKE ? OR MedicalHistory LIKE ? OR ImageProcessingHistory LIKE ? OR  FirstName LIKE ? OR LastName LIKE ? OR Gender LIKE ?  OR responsibleEmpId LIKE ?';
    params = [`%${search}%`, `%${search}%`, `%${search}%`];
  }

  query += ` LIMIT ${parseInt(offset)}, ${parseInt(limit)}`;

  try {
    const [results] = await db.execute(query, params);
    res.json(results);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//dispaly employees data
app.get('/data-emp', async (req, res) => {
  const { offset, limit } = req.query;

  console.log('Offset:', offset);
  console.log('Limit:', limit);

  try {
    const [results] = await db.execute(`SELECT EmpID, FirstName, LastName, Job, Administration, Access, supervisorId FROM Employee LIMIT ${parseInt(offset)}, ${parseInt(limit)}`);
    res.json(results);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//search the employee table
app.get('/emp-data', async (req, res) => {
  const { offset, limit, search } = req.query;

  console.log('Offset:', offset);
  console.log('Limit:', limit);
  console.log('Search:', search);

  let query = 'SELECT EmpID, FirstName, LastName, Job, Administration, Access, supervisorId FROM Employee';
  let params = [];

  if (search) {
    query += ' WHERE EmpID LIKE ? OR FirstName LIKE ? OR LastName LIKE ? OR  Job LIKE ? OR Administration LIKE ? OR Access LIKE ?  OR supervisorId LIKE ?';
    params = [`%${search}%`, `%${search}%`, `%${search}%`];
  }

  query += ` LIMIT ${parseInt(offset)}, ${parseInt(limit)}`;

  try {
    const [results] = await db.execute(query, params);
    res.json(results);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Handle password change request
app.post('/change-password', async (req, res) => {
  const { userID, currentPassword, newPassword } = req.body;

  try {
    // Check if userID and currentPassword match
    const [results] = await db.execute('SELECT * FROM Employee WHERE EmpID = ? AND Password = ?', [userID, currentPassword]);

    if (results.length === 0) {
      return res.status(401).send('Unauthorized'); // User not found or invalid credentials
    }

    // Update the password in the database
    await db.execute('UPDATE Employee SET Password = ? WHERE EmpID = ?', [newPassword, userID]);

    res.redirect('/password-changed.html');
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).send('Internal Server Error');
  }
});
// Handle password check request
app.post('/check-password', async (req, res) => {
  const { userID, currentPassword } = req.body;

  try {
    // Check if userID and currentPassword match
    const [results] = await db.execute('SELECT * FROM Employee WHERE EmpID = ? AND Password = ?', [userID, currentPassword]);

    if (results.length === 0) {
      return res.json({ success: false }); // User not found or invalid credentials
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error checking password:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Endpoint to delete a single patient
app.delete('/delete-patient/:patientId', (req, res) => {
  const patientId = req.params.patientId;

  const query = `DELETE FROM Patients WHERE PatientID = ?`;

  db.query(query, [patientId], (err, result) => {
    if (err) {
      console.error('Error deleting patient:', err);
      res.status(500).send('Error deleting patient');
      return;
    }

    res.status(200).send('Patient deleted successfully');
  });
});

// Endpoint to delete multiple patients
app.delete('/delete-patients', (req, res) => {
  const patientIds = req.body.patientIds;

  const query = `DELETE FROM Patients WHERE PatientID IN (?)`;

  db.query(query, [patientIds], (err, result) => {
    if (err) {
      console.error('Error deleting patients:', err);
      res.status(500).send('Error deleting patients');
      return;
    }

    res.status(200).send('Patients deleted successfully');
  });
});


// Endpoint to delete a single Employee
app.delete('/delete-EMP/:empId', (req, res) => {
  const empId = req.params.empId;

  const query = `DELETE FROM Employee WHERE EmpID = ?`;

  db.query(query, [empId], (err, result) => {
    if (err) {
      console.error('Error deleting employee:', err);
      res.status(500).send('Error deleting employee: ' + err.message);
      return;
    }

    if (result.affectedRows === 0) {
      res.status(404).send('Employee not found');
      return;
    }

    res.status(200).send('Employee deleted successfully');
  });
});



app.post('/saveDiagnosis', (req, res) => {
  const { patientId, predictedClass } = req.body;

  const query = 'UPDATE Patients SET MedicalHistory = ? WHERE PatientID = ?';

  const params = [`\n${predictedClass}`, patientId];
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error updating medical history:', err);
      res.status(500).send('Error updating medical history.');
    } else {
      res.send('Diagnosis saved successfully.');
    }
  });
});


// adding employees
app.post('/addEmployee', (req, res) => {
  const empFName = req.body.empFName;
  const empLName = req.body.empLName;
  const empID = req.body.empid; // Change here
  const empJob = req.body.job; // Change here
  const empAccess = req.body.access1; // Change here
  const empAdmin = req.body.access2; // Change here
  const empSupervisorId = req.body.supervisorID;
  const ppassword = req.body.Password;

  const query = 'INSERT INTO Employee (FirstName, LastName, EmpID, Job, Access, Administration, supervisorId, Password) VALUES (?, ?, ?, ?, ?, ?, ? ,?)';
  const values = [empFName, empLName, empID, empJob, empAccess, empAdmin, empSupervisorId,ppassword];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error adding employee:', err);
      res.status(500).json({ error: 'Error adding employee' });
    } else {
      res.status(200).json({ message: 'Employee added successfully' });
    }
  });
});


// add patient 
app.post('/addPatient', (req, res) => {
  const patientFName = req.body.patientFName;
  const patientLName = req.body.patientLName;
  const patientDOB = req.body.patientDOB;
  const patientGender = req.body.patientGender;
  const patientHist = req.body.patientHist;
  const patientHistIMG = req.body.patientHistIMG;
  const patientCareID = req.body.patientCareID;

  const query = 'INSERT INTO Patients (FirstName, LastName, DateOfBirth, Gender, MedicalHistory, ImageProcessingHistory, responsibleEmpId) VALUES (?, ?, ?, ?, ?, ?, ?)';
  const values = [patientFName, patientLName, patientDOB, patientGender, patientHist, patientHistIMG, patientCareID];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error adding patient:', err);
      res.status(500).json({ error: 'Error adding patient' });
    } else {
      res.status(200).json({ message: 'Patient added successfully' });
    }
  });
});



// edit patient data

app.get('/get-patient/:patientId', async (req, res) => {
  const { patientId } = req.params;
  try {
    const [rows] = await connection.execute('SELECT * FROM Patients WHERE PatientID = ?', [patientId]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'Patient not found' });
    }
  } catch (error) {
    console.error('Error fetching patient data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/update-patient/:patientId', async (req, res) => {
  const { patientId } = req.params;
  const { firstName, lastName, gender, medicalHistory, imageProcessingHistory, responsibleEmpId } = req.body;

  try {
    const [result] = await connection.execute(
      'UPDATE Patients SET FirstName = ?, LastName = ?, Gender = ?, MedicalHistory = ?, ImageProcessingHistory = ?, responsibleEmpId = ? WHERE PatientID = ?',
      [firstName, lastName, gender, medicalHistory, imageProcessingHistory, responsibleEmpId, patientId]
    );

    if (result.affectedRows > 0) {
      res.json({ message: 'Patient information updated successfully' });
    } else {
      res.status(404).json({ error: 'Patient not found' });
    }
  } catch (error) {
    console.error('Error updating patient data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});