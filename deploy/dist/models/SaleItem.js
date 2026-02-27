"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const SaleItem = (sequelize) => {
    class SaleItem extends sequelize_1.Model {
        static associate(models) {
            SaleItem.belongsTo(models.Sale, { foreignKey: 'sale_id', as: 'Sale' });
            SaleItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'Product' });
        }
    }
    SaleItem.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true
        },
        sale_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false
        },
        product_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false
        },
        quantity: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false
        },
        price: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        subtotal: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        cost_price: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'SaleItem'
    });
    return SaleItem;
};
exports.default = SaleItem;
