"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Purchase = (sequelize) => {
    class Purchase extends sequelize_1.Model {
        static associate(models) {
            Purchase.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'Supplier' });
            Purchase.hasMany(models.PurchaseItem, { foreignKey: 'purchase_id', as: 'PurchaseItems' });
            Purchase.hasMany(models.Settlement, { foreignKey: 'bill_id', constraints: false, scope: { bill_type: 'purchase' } });
        }
    }
    Purchase.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true
        },
        supplier_id: {
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
        },
        express_bill_code: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Purchase'
    });
    return Purchase;
};
exports.default = Purchase;
