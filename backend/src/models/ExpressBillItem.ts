import { DataTypes, Model, Sequelize } from 'sequelize';

interface ExpressBillItemAttributes {
  id: string;
  express_bill_id: string;
  product_id: string;
  quantity: number;
  price: number;
  subtotal: number;
}

const ExpressBillItem = (sequelize: Sequelize) => {
  class ExpressBillItem extends Model<ExpressBillItemAttributes> implements ExpressBillItemAttributes {
    public id!: string;
    public express_bill_id!: string;
    public product_id!: string;
    public quantity!: number;
    public price!: number;
    public subtotal!: number;

    public static associate(models: any) {
      ExpressBillItem.belongsTo(models.ExpressBill, { foreignKey: 'express_bill_id', as: 'ExpressBill' });
      ExpressBillItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'Product' });
    }
  }

  ExpressBillItem.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      express_bill_id: {
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
        allowNull: true
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'ExpressBillItem'
    }
  );

  return ExpressBillItem;
};

export default ExpressBillItem;