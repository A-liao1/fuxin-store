"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Brand = (sequelize) => {
    class Brand extends sequelize_1.Model {
        static associate(models) {
            Brand.hasMany(models.Product, { foreignKey: 'brand_id', as: 'Products' });
        }
    }
    Brand.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    }, {
        sequelize,
        modelName: 'Brand'
    });
    return Brand;
};
exports.default = Brand;
