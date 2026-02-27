"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const Product_1 = __importDefault(require("./Product"));
const Supplier_1 = __importDefault(require("./Supplier"));
const Customer_1 = __importDefault(require("./Customer"));
const Purchase_1 = __importDefault(require("./Purchase"));
const PurchaseItem_1 = __importDefault(require("./PurchaseItem"));
const Sale_1 = __importDefault(require("./Sale"));
const SaleItem_1 = __importDefault(require("./SaleItem"));
const Inventory_1 = __importDefault(require("./Inventory"));
const InventoryLog_1 = __importDefault(require("./InventoryLog"));
const Settlement_1 = __importDefault(require("./Settlement"));
const Brand_1 = __importDefault(require("./Brand"));
const User_1 = __importDefault(require("./User"));
const ExpressBill_1 = __importDefault(require("./ExpressBill"));
const ExpressBillItem_1 = __importDefault(require("./ExpressBillItem"));
const sequelize = new sequelize_1.Sequelize({
    dialect: 'sqlite',
    storage: './database.db'
});
exports.sequelize = sequelize;
// 初始化模型
const models = {
    Product: (0, Product_1.default)(sequelize),
    Supplier: (0, Supplier_1.default)(sequelize),
    Customer: (0, Customer_1.default)(sequelize),
    Purchase: (0, Purchase_1.default)(sequelize),
    PurchaseItem: (0, PurchaseItem_1.default)(sequelize),
    Sale: (0, Sale_1.default)(sequelize),
    SaleItem: (0, SaleItem_1.default)(sequelize),
    Inventory: (0, Inventory_1.default)(sequelize),
    InventoryLog: (0, InventoryLog_1.default)(sequelize),
    Settlement: (0, Settlement_1.default)(sequelize),
    Brand: (0, Brand_1.default)(sequelize),
    User: (0, User_1.default)(sequelize),
    ExpressBill: (0, ExpressBill_1.default)(sequelize),
    ExpressBillItem: (0, ExpressBillItem_1.default)(sequelize)
};
// 建立关联
Object.keys(models).forEach(modelName => {
    const model = models[modelName];
    if (typeof model.associate === 'function') {
        model.associate(models);
    }
});
exports.default = models;
