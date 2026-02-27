import { Sequelize } from 'sequelize';
import User from './src/models/User';

// 直接连接数据库，只处理User表
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.db'
});

const UserModel = User(sequelize);

async function initUsers() {
  try {
    console.log('开始初始化用户账户...');
    
    // 只同步User表
    await UserModel.sync({ alter: true });
    console.log('User表同步完成');
    
    // 检查并创建管理员账户
    let admin = await UserModel.findOne({ where: { username: 'admin' } });
    if (!admin) {
      admin = await UserModel.create({
        username: 'admin',
        password: 'admin123', // 会通过钩子自动哈希
        name: '系统管理员',
        role: 'admin'
      });
      console.log('管理员账户创建成功:', admin.username);
    } else {
      console.log('管理员账户已存在:', admin.username);
    }
    
    // 检查并创建新用户
    let newUser = await UserModel.findOne({ where: { username: 'liuguozhi' } });
    if (!newUser) {
      newUser = await UserModel.create({
        username: 'liuguozhi',
        password: 'lgzlww123', // 会通过钩子自动哈希
        name: '刘国治',
        role: 'admin'
      });
      console.log('新用户创建成功:', newUser.username);
    } else {
      console.log('新用户已存在:', newUser.username);
    }
    
    // 查看所有用户
    const allUsers = await UserModel.findAll();
    console.log('\n当前所有用户:');
    allUsers.forEach((user: any) => {
      console.log(`- ${user.username} (${user.name}) - 角色: ${user.role}`);
    });
    
    console.log('\n用户初始化完成');
    process.exit(0);
    
  } catch (error) {
    console.error('初始化用户失败:', error);
    process.exit(1);
  }
}

initUsers();
