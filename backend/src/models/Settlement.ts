import { DataTypes, Model, Sequelize } from 'sequelize';

interface SettlementAttributes {
  id: string;
  bill_type: string;
  bill_id: string;
  settlement_date: Date;
  amount: number;
  payment_method: string;
  remark?: string;
  express_bill_code?: string;
}

const Settlement = (sequelize: Sequelize) => {
  class Settlement extends Model<SettlementAttributes> implements SettlementAttributes {
    public id!: string;
    public bill_type!: string;
    public bill_id!: string;
    public settlement_date!: Date;
    public amount!: number;
    public payment_method!: string;
    public remark?: string;
    public express_bill_code?: string;

    public static associate(models: any) {
      // 这里不建立外键关联，因为bill_id可能指向Purchase或Sale
    }
  }

  Settlement.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      bill_type: {
        type: DataTypes.STRING,
        allowNull: false
      },
      bill_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      settlement_date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      payment_method: {
        type: DataTypes.STRING,
        allowNull: false
      },
      remark: {
        type: DataTypes.STRING,
        allowNull: true
      },
      express_bill_code: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Settlement'
    }
  );

  return Settlement;
};

export default Settlement;