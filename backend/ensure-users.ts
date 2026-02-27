import { Sequelize } from 'sequelize';
import User from './src/models/User';

// 直接连接数据库
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.db'
});

const UserModel = User(sequelize);

async function ensureUsers() {
  try {
    console.log('开始检查和创建用户...');
    
    // 同步数据库模型（只同步User表）
    await UserModel.sync({ alter: true });
    console.log('User表模型同步完成');
    
    // 定义需要的用户
    const requiredUsers = [
      { username: 'admin', password: 'admin123', name: '系统管理员', role: 'admin' },
      { username: 'liuguozhi', password: 'lgzlww123', name: '刘国治', role: 'admin' }
    ];
    
    for (const userData of requiredUsers) {
      console.log(`\n处理用户: ${userData.username}`);
      
      // 查找用户
      let user = await UserModel.findOne({ where: { username: userData.username } });
      
      if (user) {
        // 用户存在，更新密码
        user.password = userData.password;
        await user.save();
        console.log(`  用户存在，密码更新成功`);
      } else {
        // 用户不存在，创建新用户
        user = await UserModel.create(userData);
        console.log(`  用户不存在，创建成功`);
      }
      
      // 验证密码是否正确
      const isPasswordValid = await user.comparePassword(userData.password);
      console.log(`  密码验证: ${isPasswordValid ? '正确' : '错误'}`);
    }
    
    // 查看最终的用户列表
    const allUsers = await UserModel.findAll();
    console.log('\n最终用户列表:');
    allUsers.forEach((user: any) => {
      console.log(`- ${user.username} (${user.name}) - 角色: ${user.role}`);
    });
    
    console.log('\n用户检查和创建完成');
    console.log('注意：只处理了必要的用户，其他生产数据保持不变');
    
    process.exit(0);
    
  } catch (error) {
    console.error('处理用户失败:', error);
    process.exit(1);
  }
}

ensureUsers();
