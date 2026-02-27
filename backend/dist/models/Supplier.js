"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Supplier = (sequelize) => {
    class Supplier extends sequelize_1.Model {
        static associate(models) {
            Supplier.hasMany(models.Purchase, { foreignKey: 'supplier_id' });
        }
    }
    Supplier.init({
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
        modelName: 'Supplier'
    });
    return Supplier;
};
exports.default = Supplier;
