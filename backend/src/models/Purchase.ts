import { DataTypes, Model, Sequelize } from 'sequelize';

interface PurchaseAttributes {
  id: string;
  supplier_id: string;
  date: Date;
  total_amount: number;
  settlement_status: string;
  operator: string;
  remark: string;
  express_bill_code?: string;
}

const Purchase = (sequelize: Sequelize) => {
  class Purchase extends Model<PurchaseAttributes> implements PurchaseAttributes {
    public id!: string;
    public supplier_id!: string;
    public date!: Date;
    public total_amount!: number;
    public settlement_status!: string;
    public operator!: string;
    public remark!: string;
    public express_bill_code?: string;

    public static associate(models: any) {
      Purchase.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'Supplier' });
      Purchase.hasMany(models.PurchaseItem, { foreignKey: 'purchase_id', as: 'PurchaseItems' });
      Purchase.hasMany(models.Settlement, { foreignKey: 'bill_id', constraints: false, scope: { bill_type: 'purchase' } });
    }
  }

  Purchase.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      supplier_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      settlement_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '未结'
      },
      operator: {
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
      modelName: 'Purchase'
    }
  );

  return Purchase;
};

export default Purchase;