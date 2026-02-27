import { DataTypes, Model, Sequelize } from 'sequelize';

interface BrandAttributes {
  id: string;
  name: string;
}

const Brand = (sequelize: Sequelize) => {
  class Brand extends Model<BrandAttributes> implements BrandAttributes {
    public id!: string;
    public name!: string;

    public static associate(models: any) {
      Brand.hasMany(models.Product, { foreignKey: 'brand_id', as: 'Products' });
    }
  }

  Brand.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      }
    },
    {
      sequelize,
      modelName: 'Brand'
    }
  );

  return Brand;
};

export default Brand;