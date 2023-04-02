import React, { useState } from 'react';
import axios from 'axios';
import "../SearchPage/SearchPage.css";

function SearchPage() {
  const [mentors, setMentors] = useState([]);
  const [interest, setInterest] = useState('');

  const handleInterestChange = (event) => {
    setInterest(event.target.value);
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    //checking atleast one field is entered
    if (!interest && !event.target.name.value) {
      alert('Please enter a value for interest or name');
      return;
    }

    const searchData = {
      interest: interest,
      name: event.target.name.value,
    }

    const response = await axios.post('http://localhost:3001/search', searchData);
    const data = JSON.parse(response.data);
    console.log(data);
    setMentors(data.rows);
  }

  return (
    <div className="search-page">
      <form onSubmit={handleSubmit}>
        <div className="search-field">
          <select value={interest} onChange={handleInterestChange}>
            <option value="">Select Interest</option>
            <option value="Programming">Programming</option>
            <option value="Graphic Design">Graphic Design</option>
            <option value="Business">Business</option>
            <option value="Fashion">Fashion</option>
            <option value="Music">Music</option>
            <option value="Arts and Crafts">Arts and Crafts</option>
          </select>
          <input type="text" name="name" placeholder="Search by name" />
          <button type="submit">Search</button>
        </div>
      </form>
      <ul>
        {mentors.map((mentor) => (
          <li key={mentor.userName}>
            {mentor.userName} ({mentor.userInterest})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SearchPage;


app.post('/search', async (req, res) => {
    try {
  
      //extract data from request body
      const interest = req.body.interest;
      const name = req.body.name;
  
      //display login values
      console.log(`interest ${interest} and username ${name} \n`);
  
      //creating database connection
      const dbConfig = {
        user: 'finaldb',
        password: '123',
        connectString: 'localhost:1521/xe',
      };
  
      //connect to database
      const conn = await oracledb.getConnection(dbConfig);
  
      //query for search
      const query = `
           SELECT userName, userInterest FROM UsersTable
    WHERE userRole = 'mentor'
    ${interest ? `AND userInterest = '${interest}'` : ''}
    ${name ? `AND userName LIKE '%${name}%'` : ''}
        `;
  
      // const bindParams = {
      //   interest,
      //   name
      // };
  
      //execute query
      // const result = await conn.execute(query, bindParams);
      const result = await conn.execute(query);
  
      //close connection
      await conn.close();
  
      // console.log(result);
  
      //response to json
      console.log(JSON.stringify(result.rows));
      res.send(JSON.stringify(result.rows));
  
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  }
  );