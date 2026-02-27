import { Sequelize } from 'sequelize';
import Product from './Product';
import Supplier from './Supplier';
import Customer from './Customer';
import Purchase from './Purchase';
import PurchaseItem from './PurchaseItem';
import Sale from './Sale';
import SaleItem from './SaleItem';
import Inventory from './Inventory';
import InventoryLog from './InventoryLog';
import Settlement from './Settlement';
import Brand from './Brand';
import User from './User';
import ExpressBill from './ExpressBill';
import ExpressBillItem from './ExpressBillItem';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.db'
});

// 初始化模型
const models = {
  Product: Product(sequelize),
  Supplier: Supplier(sequelize),
  Customer: Customer(sequelize),
  Purchase: Purchase(sequelize),
  PurchaseItem: PurchaseItem(sequelize),
  Sale: Sale(sequelize),
  SaleItem: SaleItem(sequelize),
  Inventory: Inventory(sequelize),
  InventoryLog: InventoryLog(sequelize),
  Settlement: Settlement(sequelize),
  Brand: Brand(sequelize),
  User: User(sequelize),
  ExpressBill: ExpressBill(sequelize),
  ExpressBillItem: ExpressBillItem(sequelize)
};

// 建立关联
Object.keys(models).forEach(modelName => {
  const model = models[modelName as keyof typeof models];
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

export { sequelize };
export default models;