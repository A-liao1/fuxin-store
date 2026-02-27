"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Settlement = (sequelize) => {
    class Settlement extends sequelize_1.Model {
        static associate(models) {
            // 这里不建立外键关联，因为bill_id可能指向Purchase或Sale
        }
    }
    Settlement.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true
        },
        bill_type: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        bill_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false
        },
        settlement_date: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false
        },
        amount: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        payment_method: {
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
        modelName: 'Settlement'
    });
    return Settlement;
};
exports.default = Settlement;
