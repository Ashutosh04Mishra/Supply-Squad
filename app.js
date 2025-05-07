import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from './config/db.js';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import reportRoutes from './routes/reportRoutes.js'; // Import report routes
import { authenticateToken } from './middleware/authMiddleware.js';
import db from './models/index.js';
import bodyParser from 'body-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Test database connection
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection to the database has been established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

// Sync all models
sequelize.sync({ force: false }) // Changed to false to preserve existing data
  .then(() => {
    console.log("All models were synchronized successfully.");
  })
  .catch((err) => {
    console.error("Error synchronizing models:", err);
  });

app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sales', authenticateToken, saleRoutes);
app.use('/api/reports', authenticateToken, reportRoutes); // Use report routes

app.get('/', (req, res) => {
    res.redirect('/html/index.html');
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/register.html'));
});

app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Handle 404 errors
app.use((req, res) => {
    console.log('404 error for path:', req.path);
    res.status(404).send('Page not found');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error', 
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

async function startServer() {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connected');

        // Sync models
        await sequelize.sync({ force: false });
        console.log('Database synchronized');

        // Start server
        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Server startup error:', error);
        process.exit(1);
    }
}

startServer();

export default app;