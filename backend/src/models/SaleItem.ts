import { DataTypes, Model, Sequelize } from 'sequelize';

interface SaleItemAttributes {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  cost_price: number;
}

const SaleItem = (sequelize: Sequelize) => {
  class SaleItem extends Model<SaleItemAttributes> implements SaleItemAttributes {
    public id!: string;
    public sale_id!: string;
    public product_id!: string;
    public quantity!: number;
    public price!: number;
    public subtotal!: number;
    public cost_price!: number;

    public static associate(models: any) {
      SaleItem.belongsTo(models.Sale, { foreignKey: 'sale_id', as: 'Sale' });
      SaleItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'Product' });
    }
  }

  SaleItem.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      sale_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      cost_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'SaleItem'
    }
  );

  return SaleItem;
};

export default SaleItem;