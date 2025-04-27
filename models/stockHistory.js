import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const StockHistory = sequelize.define("StockHistory", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Products',
            key: 'id',
        },
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    oldQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    newQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    transactionType: {
        type: DataTypes.ENUM("ADD", "UPDATE", "DELETE", "ORDER"),
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: false,
});

export default StockHistory;