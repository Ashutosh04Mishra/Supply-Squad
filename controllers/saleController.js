// controllers/saleController.js
import { fn, col } from "sequelize";
import Sale from "../models/sale.js";
import Product from "../models/product.js";
import User from "../models/User.js";
import StockHistory from "../models/stockHistory.js";

const createStockHistoryEntry = async (productId, userId, oldQuantity, newQuantity, transactionType) => {
    await StockHistory.create({
        productId,
        userId,
        oldQuantity,
        newQuantity,
        transactionType,
    });
};

export const createSale = async (req, res) => {
    const { productId, quantity, totalPrice } = req.body;
    const userId = req.user.id;

    try {
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.quantity < quantity) {
            return res.status(400).json({ message: "Insufficient stock" });
        }

        // Use the totalPrice from the frontend if provided, otherwise calculate it
        const salePrice = totalPrice || (product.price * quantity);
        const sale = await Sale.create({
            productId,
            userId,
            quantity,
            totalPrice: salePrice,
        });

        const oldQuantity = product.quantity;
        const newQuantity = oldQuantity - quantity;

        product.quantity = newQuantity;
        await product.save();

        await createStockHistoryEntry(productId, userId, oldQuantity, newQuantity, "ORDER");

        res.status(201).json(sale);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getSales = async (req, res) => {
    try {
        const sales = await Sale.findAll({
            include: [
                { model: Product, as: 'product' },
                { model: User, as: 'user' },
            ],
        });
        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getSalesByProduct = async (req, res) => {
    const { productId } = req.params;
    try {
        const sales = await Sale.findAll({
            where: { productId },
            include: [
                { model: Product, as: 'product' },
                { model: User, as: 'user' },
            ],
        });
        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getSalesByUser = async (req, res) => {
    const { userId } = req.params;
    try {
        const sales = await Sale.findAll({
            where: { userId },
            include: [
                { model: Product, as: 'product' },
                { model: User, as: 'user' },
            ],
        });
        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};