// 生产环境用户初始化脚本
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.db',
  logging: false
});

// 定义User模型
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

// 添加密码比较方法
User.prototype.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

async function initUsers() {
  try {
    console.log('开始初始化用户...');
    
    // 同步模型（不改变表结构）
    await sequelize.sync({ alter: false });
    
    // 检查并创建管理员账户
    let admin = await User.findOne({ where: { username: 'admin' } });
    if (!admin) {
      admin = await User.create({
        username: 'admin',
        password: 'admin123',
        name: '系统管理员',
        role: 'admin'
      });
      console.log('✓ 管理员账户创建成功');
    } else {
      console.log('✓ 管理员账户已存在');
      // 验证密码
      const isValid = await admin.comparePassword('admin123');
      console.log(`  密码验证: ${isValid ? '正确' : '错误'}`);
      if (!isValid) {
        console.log('  重置管理员密码...');
        admin.password = 'admin123';
        await admin.save();
        console.log('  ✓ 密码重置成功');
      }
    }
    
    // 检查并创建用户 liuguozhi
    let user2 = await User.findOne({ where: { username: 'liuguozhi' } });
    if (!user2) {
      user2 = await User.create({
        username: 'liuguozhi',
        password: 'lgzlww123',
        name: '刘国治',
        role: 'admin'
      });
      console.log('✓ 用户 liuguozhi 创建成功');
    } else {
      console.log('✓ 用户 liuguozhi 已存在');
      // 验证密码
      const isValid = await user2.comparePassword('lgzlww123');
      console.log(`  密码验证: ${isValid ? '正确' : '错误'}`);
      if (!isValid) {
        console.log('  重置用户密码...');
        user2.password = 'lgzlww123';
        await user2.save();
        console.log('  ✓ 密码重置成功');
      }
    }
    
    // 显示所有用户
    const allUsers = await User.findAll();
    console.log('\n当前所有用户:');
    for (const user of allUsers) {
      console.log(`- ${user.username} (${user.name}) - 角色: ${user.role}`);
    }
    
    console.log('\n✓ 用户初始化完成');
    process.exit(0);
    
  } catch (error) {
    console.error('✗ 初始化失败:', error);
    process.exit(1);
  }
}

initUsers();
