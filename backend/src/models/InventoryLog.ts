import { DataTypes, Model, Sequelize } from 'sequelize';

interface InventoryLogAttributes {
  id: string;
  product_id: string;
  type: string;
  quantity: number;
  price: number;
  related_bill_no: string;
  balance: number;
  create_time: Date;
}

const InventoryLog = (sequelize: Sequelize) => {
  class InventoryLog extends Model<InventoryLogAttributes> implements InventoryLogAttributes {
    public id!: string;
    public product_id!: string;
    public type!: string;
    public quantity!: number;
    public price!: number;
    public related_bill_no!: string;
    public balance!: number;
    public create_time!: Date;

    public static associate(models: any) {
      InventoryLog.belongsTo(models.Product, { foreignKey: 'product_id', as: 'Product' });
    }
  }

  InventoryLog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      type: {
        type: DataTypes.STRING,
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
      related_bill_no: {
        type: DataTypes.STRING,
        allowNull: false
      },
      balance: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      create_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      modelName: 'InventoryLog'
    }
  );

  return InventoryLog;
};

export default InventoryLog;