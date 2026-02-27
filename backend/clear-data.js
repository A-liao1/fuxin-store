const fs = require('fs');
const path = require('path');

// 清除数据库数据
async function clearData() {
  try {
    console.log('开始清除数据...');
    
    // 数据库文件路径
    const dbPath = path.join(__dirname, 'database.db');
    
    // 检查数据库文件是否存在
    if (fs.existsSync(dbPath)) {
      console.log('删除数据库文件...');
      fs.unlinkSync(dbPath);
      console.log('数据库文件已删除');
    } else {
      console.log('数据库文件不存在，跳过删除');
    }
    
    console.log('数据清除完成！');
    console.log('注意：下次启动服务时，Sequelize 会自动重新创建数据库结构');
    
  } catch (error) {
    console.error('清除数据失败:', error);
  } finally {
    process.exit();
  }
}

// 运行清除数据函数
clearData();