import StockHistory from '../models/stockHistory.js';
import Sale from '../models/sale.js';
import Product from '../models/product.js';
import User from '../models/User.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js'; 
export const getStockHistory = async (req, res) => {
    try {
        const stockHistory = await StockHistory.findAll({
            include: [
                { model: Product, as: 'product' },
                { model: User, as: 'user' }
            ],
            order: [['timestamp', 'DESC']],
        });
        res.json(stockHistory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getSalesSummary = async (req, res) => {
    try {
        const salesSummary = await Sale.findAll({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('Sale.quantity')), 'totalQuantitySold'],
                [sequelize.fn('SUM', sequelize.col('Sale.totalPrice')), 'totalRevenue'],
                [sequelize.fn('COUNT', sequelize.col('Sale.id')), 'totalSalesCount'],
            ],
            include: [
                { model: Product, as: 'product', attributes: ['name'] },
                { model: User, as: 'user', attributes: ['username'] }
            ],
            group: ['Sale.productId', 'product.id', 'product.name', 'user.id', 'user.username'],
            order: [[sequelize.literal('totalRevenue'), 'DESC']],
        });

        res.json(salesSummary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
