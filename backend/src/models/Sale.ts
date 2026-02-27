import { DataTypes, Model, Sequelize } from 'sequelize';

interface SaleAttributes {
  id: string;
  customer_id: string;
  date: Date;
  total_amount: number;
  settlement_status: string;
  operator: string;
  remark: string;
}

const Sale = (sequelize: Sequelize) => {
  class Sale extends Model<SaleAttributes> implements SaleAttributes {
    public id!: string;
    public customer_id!: string;
    public date!: Date;
    public total_amount!: number;
    public settlement_status!: string;
    public operator!: string;
    public remark!: string;

    public static associate(models: any) {
      Sale.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'Customer' });
      Sale.hasMany(models.SaleItem, { foreignKey: 'sale_id', as: 'SaleItems' });
      Sale.hasMany(models.Settlement, { foreignKey: 'bill_id', constraints: false, scope: { bill_type: 'sale' } });
    }
  }

  Sale.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      customer_id: {
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
      }
    },
    {
      sequelize,
      modelName: 'Sale'
    }
  );

  return Sale;
};

export default Sale;