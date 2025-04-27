// models/index.js
import User from './User.js';
import Product from './product.js';
import StockHistory from './stockHistory.js';
import Sale from './sale.js';

Product.hasMany(StockHistory, {
    foreignKey: 'productId',
    as: 'stockHistoryEntries',
});
StockHistory.belongsTo(Product, {
    foreignKey: 'productId',
    as: 'product',
});

Product.hasMany(Sale, {
    foreignKey: 'productId',
    as: 'sales',
});
Sale.belongsTo(Product, {
    foreignKey: 'productId',
    as: 'product',
});

User.hasMany(Product, {
    foreignKey: 'userId',
    onDelete: 'CASCADE'
});

Product.belongsTo(User, {
    foreignKey: 'userId'
});

User.hasMany(Sale, {
    foreignKey: 'userId',
    as: 'sales',
});
Sale.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});

User.hasMany(StockHistory, {
    foreignKey: 'userId',
    as: 'stockHistoryEntries',
});
StockHistory.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});

// Sync models
const syncModels = async () => {
    try {
        await User.sync({ alter: true });
        await Product.sync({ alter: true });
        await StockHistory.sync({ alter: true });
        await Sale.sync({ alter: true });
        console.log('Models synchronized successfully');
    } catch (error) {
        console.error('Error syncing models:', error);
    }
};

const db = { User, Product, StockHistory, Sale, syncModels };

export default db;