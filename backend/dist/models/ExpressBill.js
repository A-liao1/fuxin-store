"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const ExpressBill = (sequelize) => {
    class ExpressBill extends sequelize_1.Model {
        static associate(models) {
            ExpressBill.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'Supplier' });
            ExpressBill.hasMany(models.ExpressBillItem, { foreignKey: 'express_bill_id', as: 'ExpressBillItems' });
            ExpressBill.belongsTo(models.Purchase, { foreignKey: 'purchase_id', as: 'Purchase' });
        }
    }
    ExpressBill.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true
        },
        express_code: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        supplier_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true
        },
        status: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            defaultValue: '待处理'
        },
        operator: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        remark: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true
        },
        purchase_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'ExpressBill'
    });
    return ExpressBill;
};
exports.default = ExpressBill;
