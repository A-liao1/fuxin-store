import { DataTypes, Model, Sequelize } from 'sequelize';

interface PurchaseItemAttributes {
  id: string;
  purchase_id: string;
  product_id: string;
  quantity: number;
  price: number;
  subtotal: number;
}

const PurchaseItem = (sequelize: Sequelize) => {
  class PurchaseItem extends Model<PurchaseItemAttributes> implements PurchaseItemAttributes {
    public id!: string;
    public purchase_id!: string;
    public product_id!: string;
    public quantity!: number;
    public price!: number;
    public subtotal!: number;

    public static associate(models: any) {
      PurchaseItem.belongsTo(models.Purchase, { foreignKey: 'purchase_id', as: 'Purchase' });
      PurchaseItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'Product' });
    }
  }

  PurchaseItem.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      purchase_id: {
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
      }
    },
    {
      sequelize,
      modelName: 'PurchaseItem'
    }
  );

  return PurchaseItem;
};

export default PurchaseItem;