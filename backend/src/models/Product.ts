import { DataTypes, Model, Sequelize } from 'sequelize';

interface ProductAttributes {
  id: string;
  name: string;
  brand_id: string;
  spec: number;
  unit: string;
  purchase_price: number;
  sale_price: number;
  min_stock: number;
}

const Product = (sequelize: Sequelize) => {
  class Product extends Model<ProductAttributes> implements ProductAttributes {
    public id!: string;
    public name!: string;
    public brand_id!: string;
    public spec!: number;
    public unit!: string;
    public purchase_price!: number;
    public sale_price!: number;
    public min_stock!: number;

    public static associate(models: any) {
      Product.belongsTo(models.Brand, { foreignKey: 'brand_id', as: 'Brand' });
      Product.hasMany(models.PurchaseItem, { foreignKey: 'product_id' });
      Product.hasMany(models.SaleItem, { foreignKey: 'product_id' });
      Product.hasOne(models.Inventory, { foreignKey: 'product_id', as: 'Inventory' });
      Product.hasMany(models.InventoryLog, { foreignKey: 'product_id', as: 'InventoryLogs' });
    }
  }

  Product.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      brand_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      spec: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: false
      },
      purchase_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      sale_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      min_stock: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'Product'
    }
  );

  return Product;
};

export default Product;