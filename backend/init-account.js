const { sequelize } = require('./src/models');
const models = require('./src/models');

async function initAccount() {
  try {
    // 同步数据库模型
    await sequelize.sync({ alter: true });
    console.log('数据库模型同步完成');

    // 检查是否已存在用户
    const existingUser = await models.User.findOne({ where: { username: 'admin' } });
    
    if (existingUser) {
      console.log('管理员用户已存在，更新密码');
      existingUser.password = 'admin123';
      await existingUser.save();
      console.log('管理员密码已更新为: admin123');
    } else {
      console.log('创建新的管理员用户');
      const newUser = await models.User.create({
        username: 'admin',
        password: 'admin123',
        name: '系统管理员',
        role: 'admin'
      });
      console.log('管理员用户创建成功:', {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role
      });
      console.log('默认密码: admin123');
    }

    console.log('账号初始化完成');
    await sequelize.close();
  } catch (error) {
    console.error('账号初始化失败:', error);
    process.exit(1);
  }
}

initAccount();
