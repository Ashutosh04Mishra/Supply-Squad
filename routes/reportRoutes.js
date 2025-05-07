// routes/reportRoutes.js
import express from 'express';
import {
    getStockHistory,
    getSalesSummary,
    getTopSellingProducts
} from '../controllers/reportController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stock-history', authenticateToken, authorizeRole("Admin", "Staff"), getStockHistory);
router.get('/sales-summary', authenticateToken, authorizeRole("Admin", "Staff"), getSalesSummary);
router.get('/top-selling-products', authenticateToken, authorizeRole("Admin", "Staff"), getTopSellingProducts);

export default router;