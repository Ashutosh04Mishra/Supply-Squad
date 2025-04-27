// models/product.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Product = sequelize.define("Product", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    quantity: { 
        type: DataTypes.INTEGER, 
        defaultValue: 0 
    },
    price: { 
        type: DataTypes.FLOAT, 
        allowNull: false 
    },
    category: { 
        type: DataTypes.STRING,
        allowNull: false
    },
    reorder_level: { 
        type: DataTypes.INTEGER, 
        defaultValue: 5 
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

export default Product;