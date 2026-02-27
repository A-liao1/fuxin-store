"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const ExpressBillItem = (sequelize) => {
    class ExpressBillItem extends sequelize_1.Model {
        static associate(models) {
            ExpressBillItem.belongsTo(models.ExpressBill, { foreignKey: 'express_bill_id', as: 'ExpressBill' });
            ExpressBillItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'Product' });
        }
    }
    ExpressBillItem.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true
        },
        express_bill_id: {
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
            allowNull: true
        },
        subtotal: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'ExpressBillItem'
    });
    return ExpressBillItem;
};
exports.default = ExpressBillItem;
