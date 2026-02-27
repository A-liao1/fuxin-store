import { sequelize } from '../models';
import models from '../models';

const { User } = models;

// 重置或创建管理员用户
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
