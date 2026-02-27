import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';

export interface UserAttributes {
  id: string;
  username: string;
  password: string;
  name: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

const User = (sequelize: any) => {
  const UserModel = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'admin'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'Users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (user: any) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user: any) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  // 实例方法：比较密码
  UserModel.prototype.comparePassword = async function (password: string) {
    return bcrypt.compare(password, this.password);
  };

  return UserModel;
};

export default User;