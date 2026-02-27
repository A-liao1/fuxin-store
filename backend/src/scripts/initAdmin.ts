import { sequelize } from '../models';
import models from '../models';

const { User } = models;

// 初始化默认管理员用户
const initAdminUser = async () => {
  try {
    // 同步数据库结构
    await sequelize.sync({ force: false });
    console.log('数据库结构同步完成');
    
    // 检查是否已存在管理员用户
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    
    if (!existingAdmin) {
      // 创建默认管理员用户
      await User.create({
        username: 'admin',
        password: 'admin123', // 默认密码，实际应用中应该使用环境变量或加密方式
        name: '系统管理员',
        role: 'admin'
      });
      
      console.log('默认管理员用户创建成功');
      console.log('用户名: admin');
      console.log('密码: admin123');
    } else {
      console.log('管理员用户已存在，跳过创建');
    }
  } catch (error) {
    console.error('创建管理员用户失败:', error);
  } finally {
    await sequelize.close();
  }
};

// 运行初始化
initAdminUser();