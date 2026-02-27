"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const PurchaseItem = (sequelize) => {
    class PurchaseItem extends sequelize_1.Model {
        static associate(models) {
            PurchaseItem.belongsTo(models.Purchase, { foreignKey: 'purchase_id', as: 'Purchase' });
            PurchaseItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'Product' });
        }
    }
    PurchaseItem.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true
        },
        purchase_id: {
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
        }
    }, {
        sequelize,
        modelName: 'PurchaseItem'
    });
    return PurchaseItem;
};
exports.default = PurchaseItem;
