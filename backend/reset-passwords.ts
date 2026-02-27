import { Sequelize } from 'sequelize';
import User from './src/models/User';
import bcrypt from 'bcryptjs';

// 直接连接数据库
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.db'
});

const UserModel = User(sequelize);

async function resetPasswords() {
  try {
    console.log('开始重置用户密码...');
    
    // 同步数据库模型
    await UserModel.sync({ alter: true });
    console.log('数据库模型同步完成');
    
    // 重置管理员密码
    let admin = await UserModel.findOne({ where: { username: 'admin' } });
    if (admin) {
      // 直接设置密码，会通过钩子自动哈希
      admin.password = 'admin123';
      await admin.save();
      console.log('管理员密码重置成功');
    } else {
      // 创建管理员账户
      admin = await UserModel.create({
        username: 'admin',
        password: 'admin123',
        name: '系统管理员',
        role: 'admin'
      });
      console.log('管理员账户创建成功');
    }
    
    // 重置新用户密码
    let newUser = await UserModel.findOne({ where: { username: 'liuguozhi' } });
    if (newUser) {
      // 直接设置密码，会通过钩子自动哈希
      newUser.password = 'lgzlww123';
      await newUser.save();
      console.log('新用户密码重置成功');
    } else {
      // 创建新用户账户
      newUser = await UserModel.create({
        username: 'liuguozhi',
        password: 'lgzlww123',
        name: '刘国治',
        role: 'admin'
      });
      console.log('新用户账户创建成功');
    }
    
    // 查看所有用户
    const allUsers = await UserModel.findAll();
    console.log('\n当前所有用户:');
    for (const user of allUsers) {
      console.log(`- ${user.username} (${user.name}) - 角色: ${user.role}`);
      // 验证密码是否正确
      const isPasswordCorrect = await user.comparePassword(
        user.username === 'admin' ? 'admin123' : 'lgzlww123'
      );
      console.log(`  密码验证: ${isPasswordCorrect ? '正确' : '错误'}`);
    }
    
    console.log('\n密码重置完成');
    process.exit(0);
    
  } catch (error) {
    console.error('密码重置失败:', error);
    process.exit(1);
  }
}

resetPasswords();
