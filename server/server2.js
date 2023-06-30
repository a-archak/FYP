const express = require("express");
const oracledb = require("oracledb");
const cors = require("cors");
const uuid = require("uuid");
const cookieparser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const http = require('http');
const { Server } = require('socket.io');


//creating an express app
const app = express();
const server = http.createServer(app);
const io = new Server({
  cors: true,
});

//configure cors and middleware to parse values
app.use(express.json());
app.use(cors());
app.use(cookieparser());

//creating database connection
const dbConfig = {
  user: 'finaldb',
  password: '123',
  connectString: 'localhost:1521/xe',
};

//for logging in the user
app.post('/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  //connect to database
  const conn = await oracledb.getConnection(dbConfig);

  //query for login
  const query = `SELECT * FROM UsersTable WHERE userName = :username AND userPassword = :password`;
  const bindParams = { username, password };

  //execute query
  const result = await conn.execute(query, bindParams);

  //close connection
  await conn.close();

  try {
    // Check if user exists
    if (result.rows.length === 1) {
      // User exists, create and sign a JWT token
      const user = result.rows[0][0];
      const role = { role: result.rows[0][6] };
      const token = jwt.sign(user, "secretkey");
      // const { password, ...others } = result.rows[0];

      // Set cookie separately
      res.cookie("accessToken", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 9000000)
      });

      // Return both responses
      res.status(200).json({ success: true, token, role, user });

    } else {
      // User does not exist, return an error response
      res.status(401).json('Invalid credentials');
    }
  }
  catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});

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

    const clean = username.replace(/\s+/g, '');
    const upperfullname = fullname.toUpperCase();
    const lowerusername = clean.toLowerCase();
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
      upperfullname,
      lowerusername,
      email,
      password,
      role,
      interest,
      experience,
      contactNumber
    };

    // console.log(`from bidnparams ${bindParams.upperfullname} and username ${bindParams.lowerusername}`);


    // Check if the userID already exists
    const uquery = `SELECT * FROM userstable WHERE username = :lowerusername`;
    const uresult = await conn.execute(uquery, { lowerusername });
    if (uresult.rows.length > 0) {
      // console.log('UserID already exists');
      return res.status(400).json('User ID already exists');
    }

    // Check if the email already exists
    const equery = `SELECT * FROM userstable WHERE userEmail = :email`;
    const eresult = await conn.execute(equery, { email });
    if (eresult.rows.length > 0) {
      // console.log('email already exists');
      return res.status(400).json('Email already exists.');
    }

    // Check if the contactNumber already exists
    const cquery = `SELECT * FROM userstable WHERE userContact = :contactNumber`;
    const cresult = await conn.execute(cquery, { contactNumber });
    if (cresult.rows.length > 0) {
      // console.log('contactNum already exists');
      return res.status(400).json('Contact number already exists');
    }

    //query if no duplicate data
    if (uresult.rows.length === 0 && eresult.rows.length === 0 && cresult.rows.length === 0) {

      // Prepare a SQL statement to insert the user registration data
      const query = `
      INSERT INTO usersTable (userID, fullName, userName, userEmail, userPassword, userRole, userInterest, userExperience, userContact)
          VALUES (:userId, :upperfullname, :lowerusername, :email, :password, :role, :interest, :experience, :contactNumber)
          `;

      //executing command
      const result = await conn.execute(query, bindParams);

      // Commit the transaction
      await conn.commit();

      console.log

      // Release the database connection
      await conn.close();

      // Return a success response
      res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json('Internal server error json');
  }
}
);

app.post('/search', async (req, res) => {
  try {
    //extract data from request body
    const interest = req.query.interest;
    const name = req.query.name.toUpperCase();

    //connect to database
    const conn = await oracledb.getConnection(dbConfig);

    //query for search
    const query = `
  SELECT u.userID, u.fullName, u.userInterest, userBio, AVG(f.ratings) AS avgRating
  FROM UsersTable u
  LEFT JOIN Feedback f ON u.userID = f.mentorID
  WHERE u.userRole = 'mentor'
  ${interest ? `AND u.userInterest = '${interest}'` : ''}
  ${name ? `AND u.fullName LIKE '%${name}%'` : ''}
  GROUP BY u.fullName, u.userInterest, u.userID, userBio  
  `;

    //execute query
    const result = await conn.execute(query);

    //close connection
    await conn.close();

    //response to json
    console.log(result.rows);
    res.send(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}
);

app.post('/updateBio', async (req, res) => {
  try {
    const bio = req.body.bio;
    const userID = req.query.userID;

    // connect to database
    const conn = await oracledb.getConnection(dbConfig);

    //query for search
    const query1 = `UPDATE usersTable SET userBio = '${bio}' where userID = '${userID}'`;

    const query2 = `Select userBio from usersTable where userID = '${userID}'`;

    //execute query
    const result = await conn.execute(query1);
    const result2 = await conn.execute(query2);

    //commit
    await conn.commit();

    //close connection
    await conn.close();

    //response to json
    res.status(200).json({ success: true, bio: `${result2.rows[0][0]}` });
  }
  catch (error) {
    console.log(error);
    console.log('something went wrong');
  }
});

app.post('/userDetails', async (req, res) => {
  const userID = req.query.userID;

  try {
    //connect to database
    const conn = await oracledb.getConnection(dbConfig);

    //query for search
    const query = `SELECT userID, fullName, userBio, userInterest FROM usersTable WHERE userID = '${userID}'`;

    //execute query
    const result = await conn.execute(query);

    //close connection
    await conn.close();

    //response to json
    res.send(result.rows);
  }
  catch (error) {
    console.log(error);
    console.log('something went wrong');
  }
});

app.post('/scheduled', async (req, res) => {
  const userID = req.query.userID;
  try {
    //connect to database
    const conn = await oracledb.getConnection(dbConfig);

    //query for search
    const query = `SELECT
    UT.fullName AS mentorName,
    BM.meetDate AS bookingDate,
    CASE
      WHEN M.isComplete = 0 THEN 'Pending'
    END AS status,
    BM.meetCode AS meetCode
  FROM
    Meetings M
    INNER JOIN Bookings BM ON M.bookingID = BM.bookingID
    INNER JOIN UsersTable UT ON BM.mentorID = UT.userID
  WHERE
    BM.menteeID = '${userID}'
    AND M.isComplete = 0`;

    //execute query
    const result = await conn.execute(query);

    //close connection
    await conn.close();

    //response to json
    res.send(result.rows);
  }
  catch (error) {
    console.log(error);
    console.log('something went wrong');
  }
});

app.post('/meetinghistory', async (req, res) => {
  const userID = req.query.userID;
  try {
    //connect to database
    const conn = await oracledb.getConnection(dbConfig);

    //query for search
    const query = `  SELECT
    UT.fullName AS mentorName,
    BM.meetDate AS bookingDate
  FROM UsersTable UT
  JOIN Bookings BM ON UT.userID = BM.mentorID
  JOIN Meetings M ON BM.bookingID = M.bookingID
  WHERE M.isComplete = 1
    AND BM.menteeID = '${userID}'`;

    //execute query
    const result = await conn.execute(query);

    //close connection
    await conn.close();

    //response to json
    res.send(result.rows);
  }
  catch (error) {
    console.log(error);
    console.log('something went wrong');
  }
});


app.post('/feedbacks', async (req, res) => {
  const userID = req.query.userID;
  try {
    //connect to database
    const conn = await oracledb.getConnection(dbConfig);

    //query for search
    const query = `   SELECT
    u1.fullName AS menteeName,
    u2.fullName AS mentorName,
    f.feedbackDate,
    f.feedbackMessage,
    f.ratings
  FROM
    Feedback f
  JOIN
    UsersTable u1 ON f.menteeID = u1.userID
  JOIN
    UsersTable u2 ON f.mentorID = u2.userID
  WHERE
    f.mentorID = '${userID}'
  `;

    //execute query
    const result = await conn.execute(query);

    //close connection
    await conn.close();

    //response to json
    console.log(result.rows);
    res.send(result.rows);
  }
  catch (error) {
    console.log(error);
    console.log('something went wrong');
  }
});

app.post('/updateFeedbacks', async (req, res) => {
  const { mentorID, menteeID, feedbackDate, feedbackMessage, ratings } = req.body;

  try {
    const formattedFeedbackDate = feedbackDate.substring(0, 10) + ' ' + feedbackDate.substring(11, 19);
    const conn = await oracledb.getConnection(dbConfig);

    // Insert the feedback into the Feedbacks table
    const insertFeedbackQuery = `
      INSERT INTO Feedback (mentorID, menteeID, feedbackDate, feedbackMessage, ratings)
      VALUES (:mentorID, :menteeID, TO_DATE(:feedbackDate, 'YYYY-MM-DD HH24:MI:SS'), :feedbackMessage, :ratings)
    `;

    // Bind the values for the query
    const feedbackValues = {
      mentorID,
      menteeID,
      feedbackDate: formattedFeedbackDate,
      feedbackMessage,
      ratings
    };
    console.log(feedbackValues.feedbackDate);

    // Execute the query
    const result = await conn.execute(insertFeedbackQuery, feedbackValues);

    //commit
    await conn.commit();

    //close
    await conn.close();

    res.status(200).json({ message: 'Feedback added successfully' });
  }
  catch (error) {
    console.error('Error inserting feedback:', error);
    res.status(500).json({ message: 'Failed to add feedback' });
  };
});


app.post('/addMeetBooking', async (req, res) => {
  let nextBookingID = 1;
  const { mentorID, menteeID, meetDate, meetCode } = req.body;

  try {
    // Generate the next booking ID
    const bookingID = nextBookingID;

    // Increment the booking ID for the next booking
    nextBookingID++;

    // Insert the meet booking into the Bookings table
    const insertBookingQuery = `
      INSERT INTO Bookings (bookingID, mentorID, menteeID, meetDate, meetCode)
      VALUES (:bookingID, :mentorID, :menteeID, TO_DATE(:meetDate, 'YYYY-MM-DD'), :meetCode)
    `;

    // Bind the values for the query
    const bookingValues = {
      bookingID,
      mentorID,
      menteeID,
      meetDate,
      meetCode
    };

    // Execute the query
    await db.execute(insertBookingQuery, bookingValues);

    res.status(200).json({ message: 'Meet booking added successfully' });
  } catch (error) {
    console.error('Error adding meet booking:', error);
    res.status(500).json({ message: 'Failed to add meet booking' });
  }
});


app.post('/users', async (req, res) => {
  const userID = req.query.userID;
  try {
    //connect to database
    const conn = await oracledb.getConnection(dbConfig);

    //query for search
    const query = `SELECT fullname, username, useremail, userrole, userinterest, userexperience, usercontact from userstable`;

    //execute query
    const result = await conn.execute(query);

    //close connection
    await conn.close();

    //response to json
    console.log(result.rows);
    res.send(result.rows);
  }
  catch (error) {
    console.log(error);
    console.log('something went wrong');
  }
});

app.post('/mentors', async (req, res) => {
  const userID = req.query.userID;
  try {
    //connect to database
    const conn = await oracledb.getConnection(dbConfig);

    //query for search
    const query = `SELECT fullname, username, useremail, userrole, userinterest, userexperience, usercontact from userstable where userRole='mentor'`;

    //execute query
    const result = await conn.execute(query);

    //close connection
    await conn.close();

    //response to json
    console.log(result.rows);
    res.send(result.rows);
  }
  catch (error) {
    console.log(error);
    console.log('something went wrong');
  }
});


app.post('/mentees', async (req, res) => {
  const userID = req.query.userID;
  try {
    //connect to database
    const conn = await oracledb.getConnection(dbConfig);

    //query for search
    const query = `SELECT fullname, username, useremail, userrole, userinterest, userexperience, usercontact from userstable where userRole='mentee'`;

    //execute query
    const result = await conn.execute(query);

    //close connection
    await conn.close();

    //response to json
    console.log(result.rows);
    res.send(result.rows);
  }
  catch (error) {
    console.log(error);
    console.log('something went wrong');
  }
});

// Handle Socket.IO events for signaling
io.on('connection', (socket) => {
  // console.log('newConnection');
  // Send offer to other clients
  socket.on('join-room', (data) => {
    const { roomId, username } = data;
    console.log(username, 'joined', roomId)
    usernameToSocketMapping.set(username, socket.id);
    socket.join(roomId);
    socket.emit("joined-room", { roomId })
    socket.broadcast.to(roomId).emit('user-joined', { username })
  });
});


//logout 
app.post('/logout', function (req, res) {
  res.clearCookie("accessToken", {
    secure: true,
    sameSite: "strict"
  });
  res.status(200).json({
    message: "User has been logged out.",
    success: true
  });
});


// Start the server
const port = process.env.PORT || 3001;
const ioport = process.env.PORT || 8001;

app.listen(port, () => {

  console.log(`Server started on port ${port}`);

});

io.listen(ioport);