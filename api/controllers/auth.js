import { db } from "../connect.js"

export const register = (req, res) => {

    //Check user
    const q = "SELECT FROM users WHERE username = ?"
    db.query(q, [req.body.username], (err, data) => {
        if (err) return res.status(500).json(err)
        if (data.length) return res.status(409).json("User already exists")
        //Create new user
        //hash password
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(req.body.password, salt)

        const q = `INSERT INTO usersTable (userID, fullName, userName, userEmail, userPassword, userRole, userInterest, userExperience, userContact)
        VALUES (:userId, :fullname, :username, :email, :password, :role, :interest, :experience, :contactNumber)
        `;
    })


}


export const login = (req, res) => {


}


export const logout = (req, res) => {


}

