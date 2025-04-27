// models/sale.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Sale = sequelize.define("Sale", {
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
        references: {
            model: 'Users',
            key: 'id',
        },
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    totalPrice: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    saleDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: true,
});

export default Sale;