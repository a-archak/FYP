const express = require("express");
const oracledb = require("oracledb");
const cors = require("cors");
const uuid = require("uuid");


// console.log(uuid.v4());

//creating an express app
const app = express();

//configure cors and middleware to parse values
app.use(express.json());
app.use(cors());

//for logging in the user
app.post('/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  //display login values
  console.log(`User ${username} is attempting to log in with password ${password}`);

  //creating database connection
  const dbConfig = {
    user: 'final',
    password: '123',
    connectString: 'localhost:1521/xe',
  };

  //connect to database
  const conn = await oracledb.getConnection(dbConfig);

  //query for login
  const query = `SELECT * FROM UsersTable WHERE userName = :username AND userPassword = :password`;
  const bindParams = { username, password };

  //execute query
  const result = await conn.execute(query, bindParams);

  // console.log(result);
  console.log(result.rows.length);

  //close connection
  await conn.close();

  // Check if user exists
  if (result.rows.length === 1) {
    // User exists, return a success response
    res.status(200).json({ success: true });
    // res.send(result);
    console.log(result);
  } else {
    // User does not exist, return an error response
    res.send({ message: 'Invalid entered details' });
  }
});


// Define a POST route to handle registration form submission
app.post('/registerUser', async (req, res) => {
  try {
    // Extract data from request body
    const userId = uuid.v4();
    const {
      username,
      email,
      password,
      userType,
      interest,
      experience,
      contactNumber
    } = req.body;

    //display registration values
    console.log(`
      \n userID: ${userId}
      \n username: ${username} 
      \n password: ${password} 
      \n email: ${email} 
      \n userType: ${userType} 
      \n interest: ${interest} 
      \n experience: ${experience} 
      \n contactNumber: ${contactNumber} \n
    `);

    // Define Oracle database connection details
    const dbConfig = {
      user: 'final',
      password: '123',
      connectString: 'localhost:1521/xe',
    };

    // Connect to the database
    const conn = await oracledb.getConnection(dbConfig);

    // Determine the table to insert the user data based on userType
    let role;
    if (userType === 'mentor') {
      // table = 'mentors';
      role = 'mentor';
    } else if (userType === 'mentee') {
      // table = 'mentees';
      role = 'mentee';
    } else {
      throw new Error('Invalid userType');
    }

    const bindParams = {
      userId,
      username,
      email,
      password,
      role,
      interest,
      experience,
      contactNumber
    };

    console.log(bindParams.userId.toString());

    // Check if the userID already exists
    const uquery = `SELECT * FROM userstable WHERE username = :username`;
    const uresult = await conn.execute(uquery, { username });
    if (uresult.rows.length > 0) {
      console.log('UserID already exists');
      return res.status(400).json({ error: 'User ID already exists' });
    }

    // Check if the email already exists
    const equery = `SELECT * FROM userstable WHERE userEmail = :email`;
    const eresult = await conn.execute(equery, { email });
    if (eresult.rows.length > 0) {
      console.log('email already exists');
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Check if the contactNumber already exists
    const cquery = `SELECT * FROM userstable WHERE userContact = :contactNumber`;
    const cresult = await conn.execute(cquery, { contactNumber });
    if (cresult.rows.length > 0) {
      console.log('contactNum already exists');
      return res.status(400).json({ error: 'Contact number already exists' });
    }

    //query if no duplicate data
    if (uresult.rows.length === 0 && eresult.rows.length === 0 && cresult.rows.length === 0) {
      // Prepare a SQL statement to insert the user registration data
      const query = `
    INSERT INTO userstable (userID, userName, userEmail, userPassword, userRole, userInterest, userExperience, userContact)
        VALUES (:userId, :username, :email, :password, :role, :interest, :experience, :contactNumber)
        `;

      //executing command
      const result = await conn.execute(query, bindParams);

      // Commit the transaction
      await conn.commit();

      // Release the database connection
      await conn.close();

      // Return a success response
      res.status(200).json({ success: true });
      console.log("committed");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error json' });
  }
}
);


//logout of session
app.get('/logout', function (req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        console.log('logged out')
        res.status(200).json({ respage: true });
      }
    });
  }
});

// Start the server
const port = process.env.PORT || 3001;
app.listen(port, () => {

  console.log(`Server started on port ${port}`);

});