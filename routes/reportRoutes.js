// routes/reportRoutes.js
import express from 'express';
import {
    getStockHistory,
    getSalesSummary,
} from '../controllers/reportController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stock-history', authenticateToken, getStockHistory);
router.get('/sales-summary', authenticateToken, getSalesSummary);

export default router;