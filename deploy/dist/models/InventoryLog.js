"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const InventoryLog = (sequelize) => {
    class InventoryLog extends sequelize_1.Model {
        static associate(models) {
            InventoryLog.belongsTo(models.Product, { foreignKey: 'product_id', as: 'Product' });
        }
    }
    InventoryLog.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true
        },
        product_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false
        },
        type: {
            type: sequelize_1.DataTypes.STRING,
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
        related_bill_no: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        balance: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false
        },
        create_time: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'InventoryLog'
    });
    return InventoryLog;
};
exports.default = InventoryLog;
