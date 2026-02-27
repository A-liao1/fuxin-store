"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Inventory = (sequelize) => {
    class Inventory extends sequelize_1.Model {
        static associate(models) {
            Inventory.belongsTo(models.Product, { foreignKey: 'product_id', as: 'Product' });
        }
    }
    Inventory.init({
        product_id: {
            type: sequelize_1.DataTypes.UUID,
            primaryKey: true
        },
        current_quantity: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        avg_cost: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        }
    }, {
        sequelize,
        modelName: 'Inventory'
    });
    return Inventory;
};
exports.default = Inventory;
