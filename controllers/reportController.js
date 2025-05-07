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
        // Get the user role from the authenticated request
        const userRole = req.user.role;
        const userId = req.user.id;
        
        // Define query options
        const queryOptions = {
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
        };
        
        // If user is not Admin or Staff, only show their own sales
        if (userRole !== 'Admin' && userRole !== 'Staff') {
            queryOptions.where = { userId: userId };
        }
        
        // Get sales summary based on user role
        const salesSummary = await Sale.findAll(queryOptions);

        res.json(salesSummary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getTopSellingProducts = async (req, res) => {
    try {
        // Get the top 3 selling products by quantity across all users
        const topProducts = await Sale.findAll({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('Sale.quantity')), 'totalQuantitySold'],
                [sequelize.fn('SUM', sequelize.col('Sale.totalPrice')), 'totalRevenue'],
                [sequelize.fn('COUNT', sequelize.col('Sale.id')), 'totalSalesCount'],
            ],
            include: [
                { model: Product, as: 'product', attributes: ['name', 'price'] },
                { model: User, as: 'user', attributes: ['username'] }
            ],
            // No userId filter - show all sales across all users
            group: ['Sale.productId', 'product.id', 'product.name', 'product.price', 'user.id', 'user.username'],
            order: [[sequelize.literal('totalQuantitySold'), 'DESC']],
            limit: 3 // Limit to top 3 products
        });

        res.json(topProducts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
