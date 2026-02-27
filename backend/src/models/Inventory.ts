import { DataTypes, Model, Sequelize } from 'sequelize';

interface InventoryAttributes {
  product_id: string;
  current_quantity: number;
  avg_cost: number;
}

const Inventory = (sequelize: Sequelize) => {
  class Inventory extends Model<InventoryAttributes> implements InventoryAttributes {
    public product_id!: string;
    public current_quantity!: number;
    public avg_cost!: number;

    public static associate(models: any) {
      Inventory.belongsTo(models.Product, { foreignKey: 'product_id', as: 'Product' });
    }
  }

  Inventory.init(
    {
      product_id: {
        type: DataTypes.UUID,
        primaryKey: true
      },
      current_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      avg_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      sequelize,
      modelName: 'Inventory'
    }
  );

  return Inventory;
};

export default Inventory;