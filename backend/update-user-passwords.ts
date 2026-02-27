import { Sequelize } from 'sequelize';
import User from './src/models/User';

// 直接连接数据库
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.db'
});

const UserModel = User(sequelize);

async function updateUserPasswords() {
  try {
    console.log('开始更新用户密码...');
    
    // 同步数据库模型（只同步User表）
    await UserModel.sync({ alter: true });
    console.log('User表模型同步完成');
    
    // 只更新现有的用户密码，不创建新用户
    const users = await UserModel.findAll();
    console.log(`找到 ${users.length} 个用户`);
    
    for (const user of users) {
      console.log(`\n处理用户: ${user.username} (${user.name})`);
      
      // 根据用户名设置对应的密码
      let newPassword: string;
      if (user.username === 'admin') {
        newPassword = 'admin123';
      } else if (user.username === 'liuguozhi') {
        newPassword = 'lgzlww123';
      } else {
        // 对于其他用户，保持密码不变
        console.log(`  跳过用户 ${user.username}，保持密码不变`);
        continue;
      }
      
      // 更新密码（会通过钩子自动哈希）
      user.password = newPassword;
      await user.save();
      console.log(`  密码更新成功，新密码: ${newPassword}`);
      
      // 验证密码是否正确
      const isPasswordValid = await user.comparePassword(newPassword);
      console.log(`  密码验证: ${isPasswordValid ? '正确' : '错误'}`);
    }
    
    console.log('\n用户密码更新完成');
    console.log('注意：只更新了指定用户的密码，其他生产数据保持不变');
    
    process.exit(0);
    
  } catch (error) {
    console.error('更新用户密码失败:', error);
    process.exit(1);
  }
}

updateUserPasswords();
