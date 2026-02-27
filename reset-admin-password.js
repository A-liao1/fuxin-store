const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// 连接数据库
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: '/root/deploy/database.db'
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
  updatedAt: 'updated_at'
});

// 实例方法：比较密码
User.prototype.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// 重置admin密码
async function resetAdminPassword() {
  try {
    console.log('开始重置admin密码...');
    
    // 查找admin用户
    const user = await User.findOne({ where: { username: 'admin' } });
    if (!user) {
      console.log('admin用户不存在，创建新用户...');
      // 创建新的admin用户
      const newUser = await User.create({
        username: 'admin',
        password: 'admin123',
        name: '系统管理员',
        role: 'admin'
      });
      console.log('admin用户创建成功，密码设置为: admin123');
    } else {
      console.log('admin用户存在，更新密码...');
      // 更新密码
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await user.update({ password: hashedPassword });
      console.log('admin密码更新成功，新密码为: admin123');
    }
    
    console.log('操作完成');
    process.exit(0);
  } catch (error) {
    console.error('重置密码失败:', error);
    process.exit(1);
  }
}

// 执行重置操作
resetAdminPassword();