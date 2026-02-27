"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Product = (sequelize) => {
    class Product extends sequelize_1.Model {
        static associate(models) {
            Product.belongsTo(models.Brand, { foreignKey: 'brand_id', as: 'Brand' });
            Product.hasMany(models.PurchaseItem, { foreignKey: 'product_id' });
            Product.hasMany(models.SaleItem, { foreignKey: 'product_id' });
            Product.hasOne(models.Inventory, { foreignKey: 'product_id', as: 'Inventory' });
            Product.hasMany(models.InventoryLog, { foreignKey: 'product_id', as: 'InventoryLogs' });
        }
    }
    Product.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        brand_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false
        },
        spec: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        unit: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        purchase_price: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        sale_price: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        min_stock: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'Product'
    });
    return Product;
};
exports.default = Product;
