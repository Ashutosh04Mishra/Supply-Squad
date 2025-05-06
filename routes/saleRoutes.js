// routes/saleRoutes.js
import express from "express";
import {
    createSale,
    getSales,
    getSalesByProduct,
    getSalesByUser,
} from "../controllers/saleController.js";
import { authenticateToken, authorizeRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticateToken, authorizeRole("Admin", "Staff"), createSale);
router.get("/", authenticateToken, authorizeRole("Admin", "Staff"), getSales);
router.get("/product/:productId", authenticateToken, authorizeRole("Admin", "Staff"), getSalesByProduct);
router.get("/user/:userId", authenticateToken, authorizeRole("Admin", "Staff"), getSalesByUser);

export default router;