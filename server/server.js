const oracledb = require('oracledb');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Create a new express app
const app = express();

//configure CORS
app.use(cors());

// Configure bodyParser middleware to parse request body as JSON
app.use(bodyParser.json());

// Define a POST route to handle registration form submission
app.post('/registerUser', async (req, res) => {
  try {
    // Extract data from request body
    const { username, email, password, userType, interest, experience, contactNumber } = req.body;

    //display registration values
    console.log(` ${username} and ${password} and ${email} and ${userType} and ${interest} and ${experience} and ${contactNumber}`);

    // Define Oracle database connection details
    const dbConfig = {
      user: 'mentor',
      password: '123',
      connectString: 'localhost:1521/xe',
    };

    // Connect to the database
    const conn = await oracledb.getConnection(dbConfig);

    // Determine the table to insert the user data based on userType
    let table;
    let role;
    if (userType === 'mentor') {
      table = 'mentors';
      role = 'mentor';
    } else if (userType === 'mentee') {
      table = 'mentees';
      role = 'mentee';
    } else {
      throw new Error('Invalid userType');
    }

    //creating unique userID
    

    //displaying user input
    console.log(`Userrole is ${role} is registering in table ${table}`);

    // Prepare a SQL statement to insert the user registration data
    const sql = `
      INSERT INTO users (userID, userName, userEmail, userPassword, userRole)
      VALUES (users_sequence.nextval, :username, :email, :password, :role)
      RETURNING userID INTO :newUserID;
    `;
    const bindParams = {
      username,
      email,
      password,
      role,
      newUserID: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
    };
    const result = await conn.execute(sql, bindParams);
    const userID = result.outBinds.newUserID[0];

    // Prepare a SQL statement to insert the user's specific details
    const specificDetailsSQL = `
      INSERT INTO ${table} (userID, fieldOfExpertise, experience)
      VALUES (:userID, :interest, :experience);
    `;
    const specificDetailsBindParams = {
      userID,
      interest,
      experience,
    };
    await conn.execute(specificDetailsSQL, specificDetailsBindParams);

    // Commit the transaction
    await conn.commit();

    // Release the database connection
    await conn.close();

    // Return a success response
    res.status(200).json({ success: true });
    console.log("committed");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error json' });
  }
});

//defining post route to handle registration
app.post('/login', async (req, res) => {
  try {
    // Extract data from request body
    const username = req.body.username;
    const password = req.body.password;

    //display login values
    console.log(`User ${username} is attempting to log in with password ${password}`);

    // Define Oracle database connection details
    const dbConfig = {
      user: 'mentor',
      password: '123',
      connectString: 'localhost:1521/xe',
    };

    // Connect to the database
    const conn = await oracledb.getConnection(dbConfig);

    // Prepare a SQL statement to check if user exists
    const sql = `
      SELECT *
      FROM users
      WHERE userName = :username AND userPassword = :password
    `;
    const bindParams = {
      username,
      password,
    };
    const result = await conn.execute(sql, bindParams);

    // Release the database connection
    await conn.close();

    // Check if user exists
    if (result.rows.length === 1) {
      // User exists, return a success response
      const user = result.rows[0];
      res.status(200).json({
        success: true,
        userID: user[0],
        userName: user[1],
        userEmail: user[2],
        userRole: user[4],
      });
    } else {
      // User does not exist, return an error response
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error login' });
  }
});

// Start the server
const port = process.env.PORT || 3001;
app.listen(port, () => {

  console.log(`Server started on port ${port}`);

});
