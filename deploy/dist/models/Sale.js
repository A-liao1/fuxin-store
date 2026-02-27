"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Sale = (sequelize) => {
    class Sale extends sequelize_1.Model {
        static associate(models) {
            Sale.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'Customer' });
            Sale.hasMany(models.SaleItem, { foreignKey: 'sale_id', as: 'SaleItems' });
            Sale.hasMany(models.Settlement, { foreignKey: 'bill_id', constraints: false, scope: { bill_type: 'sale' } });
        }
    }
    Sale.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true
        },
        customer_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false
        },
        date: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false
        },
        total_amount: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        settlement_status: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            defaultValue: '未结'
        },
        operator: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        remark: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Sale'
    });
    return Sale;
};
exports.default = Sale;
