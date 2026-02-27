import { DataTypes, Model, Sequelize } from 'sequelize';

interface SupplierAttributes {
  id: string;
  name: string;
  phone: string;
}

const Supplier = (sequelize: Sequelize) => {
  class Supplier extends Model<SupplierAttributes> implements SupplierAttributes {
    public id!: string;
    public name!: string;
    public phone!: string;

    public static associate(models: any) {
      Supplier.hasMany(models.Purchase, { foreignKey: 'supplier_id' });
    }
  }

  Supplier.init(
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
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Supplier'
    }
  );

  return Supplier;
};

export default Supplier;