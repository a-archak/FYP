const express = require("express");
const oracledb = require("oracledb");
const cors = require("cors");
const uuid = require("uuid");
const cookieparser = require("cookie-parser")
const jwt = require("jsonwebtoken")


//creating an express app
const app = express();

//configure cors and middleware to parse values
app.use(express.json());
app.use(cors());
app.use(cookieparser());


// Define a POST route to handle registration form submission
app.post('/registerUser', async (req, res) => {
    try {
      // Extract data from request body
      const userId = uuid.v4();
      const {
        fullname,
        username,
        email,
        password,
        userType,
        interest,
        experience,
        contactNumber
      } = req.body;
  
      // display registration values
      console.log(`
        \n fullname: ${fullname}
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
        user: 'finaldb',
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
        fullname,
        username,
        email,
        password,
        role,
        interest,
        experience,
        contactNumber
      };
  
  
      // Check if the userID already exists
      const uquery = `SELECT * FROM userstable WHERE username = :username`;
      const uresult = await conn.execute(uquery, { username });
      if (uresult.rows.length > 0) {
        console.log('UserID already exists');
        return res.status(400).json('User ID already exists');
      }
  
      // Check if the email already exists
      const equery = `SELECT * FROM userstable WHERE userEmail = :email`;
      const eresult = await conn.execute(equery, { email });
      if (eresult.rows.length > 0) {
        console.log('email already exists');
        return res.status(400).json('Email already exists');
      }
  
      // Check if the contactNumber already exists
      const cquery = `SELECT * FROM userstable WHERE userContact = :contactNumber`;
      const cresult = await conn.execute(cquery, { contactNumber });
      if (cresult.rows.length > 0) {
        console.log('contactNum already exists');
        return res.status(400).json('Contact number already exists');
      }
  
      //query if no duplicate data
      if (uresult.rows.length === 0 && eresult.rows.length === 0 && cresult.rows.length === 0) {
  
        // Prepare a SQL statement to insert the user registration data
        const query = `
        INSERT INTO usersTable (userID, fullName, userName, userEmail, userPassword, userRole, userInterest, userExperience, userContact)
            VALUES (:userId, :fullname, :username, :email, :password, :role, :interest, :experience, :contactNumber)
            `;
  
        //executing command
        const result = await conn.execute(query, bindParams);
  
        // Commit the transaction
        await conn.commit();
  
        // Release the database connection
        await conn.close();
  
        // Return a success response
        res.status(200).json({ success: true });
        console.log(result);
        console.log("committed");
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error json' });
    }
  }
  );