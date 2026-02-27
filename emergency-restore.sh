#!/bin/bash

# 紧急数据恢复脚本

SERVER="root@104.223.59.170"
DEPLOY_DIR="/root/fuxin"
BACKUP_DIR="/root/backups"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "=========================================="
echo "紧急数据恢复脚本"
echo "=========================================="
echo ""

# 列出所有备份
print_info "查找可用备份..."
ssh $SERVER "ls -lh $BACKUP_DIR/*.bak"
echo ""

# 检查每个备份的数据量
print_info "检查备份数据..."
ssh $SERVER "cd $DEPLOY_DIR && node -e \"
const { Sequelize } = require('sequelize');
const fs = require('fs');

(async () => {
  const backups = fs.readdirSync('$BACKUP_DIR')
    .filter(f => f.endsWith('.bak'))
    .map(f => '$BACKUP_DIR/' + f)
    .sort()
    .reverse()
    .slice(0, 5);
  
  for (const backup of backups) {
    const stat = fs.statSync(backup);
    console.log(\\\`\\\n备份: \\\${backup}\\\`);
    console.log(\\\`大小: \\\${(stat.size / 1024).toFixed(2)} KB\\\`);
    console.log(\\\`时间: \\\${stat.mtime.toLocaleString('zh-CN')}\\\`);
    
    const sequelize = new Sequelize({ 
      dialect: 'sqlite', 
      storage: backup, 
      logging: false 
    });
    
    try {
      const tables = ['Users', 'Products', 'Suppliers', 'Customers', 'Purchases', 'Sales', 'Brands'];
      let totalRecords = 0;
      for (const table of tables) {
        const [results] = await sequelize.query(\\\`SELECT COUNT(*) as count FROM \\\${table}\\\`);
        const count = results[0].count;
        totalRecords += count;
        if (count > 0) {
          console.log(\\\`  - \\\${table}: \\\${count} 条记录\\\`);
        }
      }
      console.log(\\\`  总计: \\\${totalRecords} 条记录\\\`);
    } catch (error) {
      console.error(\\\`  错误: \\\${error.message}\\\`);
    }
    await sequelize.close();
  }
  process.exit(0);
})();
\""

echo ""
echo "=========================================="
read -p "请输入要恢复的备份文件名（或输入 'cancel' 取消）: " backup_file

if [ "$backup_file" = "cancel" ]; then
    print_warning "恢复已取消"
    exit 0
fi

if [ -z "$backup_file" ]; then
    print_error "未指定备份文件"
    exit 1
fi

# 确认恢复
echo ""
print_warning "警告：此操作将覆盖当前数据库！"
read -p "确认要恢复备份 $backup_file 吗？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    print_warning "恢复已取消"
    exit 0
fi

# 执行恢复
print_info "停止服务..."
ssh $SERVER "pm2 stop fuxin"

print_info "备份当前数据库..."
ssh $SERVER "cp $DEPLOY_DIR/database.db $BACKUP_DIR/database.db.before_restore_\$(date +%Y%m%d_%H%M%S).bak"

print_info "恢复数据库..."
ssh $SERVER "cp $BACKUP_DIR/$backup_file $DEPLOY_DIR/database.db"

print_info "启动服务..."
ssh $SERVER "pm2 start fuxin"

print_success "数据恢复完成！"

# 验证恢复结果
echo ""
print_info "验证恢复结果..."
sleep 3
ssh $SERVER "cd $DEPLOY_DIR && node -e \"
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({ 
  dialect: 'sqlite', 
  storage: './database.db', 
  logging: false 
});

(async () => {
  try {
    const tables = ['Users', 'Products', 'Suppliers', 'Customers', 'Purchases', 'Sales', 'Brands'];
    console.log('当前数据库内容:');
    for (const table of tables) {
      const [results] = await sequelize.query(\\\`SELECT COUNT(*) as count FROM \\\${table}\\\`);
      console.log(\\\`- \\\${table}: \\\${results[0].count} 条记录\\\`);
    }
  } catch (error) {
    console.error('错误:', error.message);
  }
  process.exit(0);
})();
\""

echo ""
print_success "恢复完成！"
