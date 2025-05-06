// routes/productRoutes.js
import express from "express";
import {
    addProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    getLowStockProducts,
    getProductById
} from "../controllers/productController.js";
import { authenticateToken, authorizeRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateToken, getProducts);
router.post("/", authenticateToken, authorizeRole("Admin"), addProduct);
router.get("/low-stock", authenticateToken, getLowStockProducts);
router.delete("/:id", authenticateToken, authorizeRole("Admin"), deleteProduct);
router.get("/:id", authenticateToken, getProductById);
router.put("/:id", authenticateToken, authorizeRole("Admin"), updateProduct);

export default router;