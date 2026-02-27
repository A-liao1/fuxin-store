"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Customer = (sequelize) => {
    class Customer extends sequelize_1.Model {
        static associate(models) {
            Customer.hasMany(models.Sale, { foreignKey: 'customer_id' });
        }
    }
    Customer.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        phone: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Customer'
    });
    return Customer;
};
exports.default = Customer;
