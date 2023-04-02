import oracledb from "oracledb";

// Define Oracle database connection details
const dbConfig = {
    user: 'finaldb',
    password: '123',
    connectString: 'localhost:1521/xe',
};

// Connect to the database
export const db =  oracledb.getConnection(dbConfig);