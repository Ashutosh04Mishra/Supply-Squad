import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const dbName = process.env.DB_NAME || 'inventory_db';
const dbUser = process.env.DB_USER || 'root'; // Replace with your MySQL username
const dbPassword = process.env.DB_PASSWORD || 'SANmisra@3'; // Replace with your MySQL password
const dbHost = process.env.DB_HOST || 'localhost';      // Typically 'localhost'
const dbPort = process.env.DB_PORT || 3306;          // Default MySQL port is 3306

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql', // Specify that you're using MySQL
    //   dialectOptions: { // Only if you have specific requirements
    //     ssl: true,  // Example: Enable SSL (if needed)
    //   },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    logging: false, // Set to false to hide SQL queries
});

// Test the connection
sequelize.authenticate()
    .then(() => {
        console.log('Database connection established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

export default sequelize;