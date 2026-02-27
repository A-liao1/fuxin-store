// 重置管理员用户密码的脚本
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// 创建数据库连接
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: '/root/deploy/database.db'
});

// 定义用户模型
const User = sequelize.define('User', {
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
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

// 实例方法：比较密码
User.prototype.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// 重置管理员用户
const resetAdminUser = async () => {
  try {
    // 同步数据库结构
    await sequelize.sync({ force: false });
    console.log('数据库结构同步完成');
    
    // 查找或创建管理员用户
    let adminUser = await User.findOne({ where: { username: 'admin' } });
    
    if (adminUser) {
      // 更新现有管理员用户的密码
      adminUser.password = 'admin123';
      await adminUser.save();
      console.log('管理员用户密码重置成功');
      console.log('用户名: admin');
      console.log('密码: admin123');
    } else {
      // 创建新的管理员用户
      adminUser = await User.create({
        username: 'admin',
        password: 'admin123',
        name: '系统管理员',
        role: 'admin'
      });
      console.log('默认管理员用户创建成功');
      console.log('用户名: admin');
      console.log('密码: admin123');
    }
    
    console.log('管理员用户信息:', {
      id: adminUser.id,
      username: adminUser.username,
      name: adminUser.name,
      role: adminUser.role
    });
    
  } catch (error) {
    console.error('重置管理员用户失败:', error);
  } finally {
    await sequelize.close();
  }
};

// 运行重置
resetAdminUser();
