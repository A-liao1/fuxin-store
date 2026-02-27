import { DataTypes, Model, Sequelize } from 'sequelize';

interface CustomerAttributes {
  id: string;
  name: string;
  phone: string;
}

const Customer = (sequelize: Sequelize) => {
  class Customer extends Model<CustomerAttributes> implements CustomerAttributes {
    public id!: string;
    public name!: string;
    public phone!: string;

    public static associate(models: any) {
      Customer.hasMany(models.Sale, { foreignKey: 'customer_id' });
    }
  }

  Customer.init(
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
      modelName: 'Customer'
    }
  );

  return Customer;
};

export default Customer;