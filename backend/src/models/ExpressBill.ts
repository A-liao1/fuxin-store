import { DataTypes, Model, Sequelize } from 'sequelize';

interface ExpressBillAttributes {
  id: string;
  express_code: string;
  supplier_id: string | null;
  status: string;
  operator: string;
  remark: string;
  purchase_id: string | null;
  ExpressBillItems?: any[];
  Supplier?: any;
  Purchase?: any;
}

const ExpressBill = (sequelize: Sequelize) => {
  class ExpressBill extends Model<ExpressBillAttributes> implements ExpressBillAttributes {
    public id!: string;
    public express_code!: string;
    public supplier_id!: string | null;
    public status!: string;
    public operator!: string;
    public remark!: string;
    public purchase_id!: string | null;
    public ExpressBillItems?: any[];
    public Supplier?: any;
    public Purchase?: any;

    public static associate(models: any) {
      ExpressBill.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'Supplier' });
      ExpressBill.hasMany(models.ExpressBillItem, { foreignKey: 'express_bill_id', as: 'ExpressBillItems' });
      ExpressBill.belongsTo(models.Purchase, { foreignKey: 'purchase_id', as: 'Purchase' });
    }
  }

  ExpressBill.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      express_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      supplier_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '待处理'
      },
      operator: {
        type: DataTypes.STRING,
        allowNull: false
      },
      remark: {
        type: DataTypes.STRING,
        allowNull: true
      },
      purchase_id: {
        type: DataTypes.UUID,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'ExpressBill'
    }
  );

  return ExpressBill;
};

export default ExpressBill;