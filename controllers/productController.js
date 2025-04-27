// controllers/productController.js
import Product from "../models/product.js";
// import StockHistory from "../models/stockHistory.js";
import { Op } from 'sequelize';

// const createStockHistoryEntry = async (productId, userId, oldQuantity, newQuantity, transactionType) => {
//     await StockHistory.create({
//         productId,
//         userId,
//         oldQuantity,
//         newQuantity,
//         transactionType,
//     });
// };

export const addProduct = async (req, res) => {
    try {
        const { name, quantity, price, category, reorder_level } = req.body;
        const userId = req.user.id;

        // Log the data being sent
        console.log('Adding product:', {
            name,
            quantity,
            price,
            category,
            reorder_level,
            userId
        });

        // Validate the data
        if (!name || !category || quantity === undefined || price === undefined) {
            return res.status(400).json({
                error: 'Missing required fields',
                received: { name, category, quantity, price }
            });
        }

        // Create the product
        const product = await Product.create({
            name,
            quantity: Number(quantity),
            price: Number(price),
            category,
            reorder_level: Number(reorder_level) || 5,
            userId
        });

        console.log('Product created successfully:', product.toJSON());

        res.status(201).json({
            message: 'Product added successfully',
            product: product.toJSON()
        });

    } catch (error) {
        console.error('Error adding product:', error);
        console.error('Error stack:', error.stack);
        console.log('Request user:', req.user); // Check if user is properly authenticated
        res.status(500).json({
            error: 'Failed to add product',
            details: error.message,
            stack: error.stack
        });
    }
};

export const getProducts = async (req, res) => {
    try {
        const userId = req.user.id;
        const products = await Product.findAll({
            where: { userId }
        });
        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Failed to fetch products" });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { name, quantity, price, category, reorder_level } = req.body;

        const product = await Product.findOne({
            where: { 
                id: id,
                userId: userId
            }
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found or unauthorized' });
        }

        await product.update({
            name,
            quantity,
            price,
            category,
            reorder_level
        });

        res.status(200).json({ 
            message: 'Product updated successfully',
            product: product.toJSON()
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
};

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: "Server error while fetching product" });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const deleted = await Product.destroy({
            where: { 
                id: id,
                userId: userId
            }
        });

        if (!deleted) {
            return res.status(404).json({ message: 'Product not found or unauthorized' });
        }

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
};

export const getLowStockProducts = async (req, res) => {
    try {
        const userId = req.user.id;
        // Find all products where quantity is less than or equal to reorder_level
        const products = await Product.findAll({
            where: {
                userId
            }
        });
        
        // Filter products where quantity <= reorder_level
        const lowStockProducts = products.filter(product => {
            return product.quantity <= product.reorder_level;
        });
        
        res.json(lowStockProducts);
    } catch (error) {
        console.error('Error fetching low stock products:', error);
        res.status(500).json({ error: 'Failed to fetch low stock products' });
    }
};