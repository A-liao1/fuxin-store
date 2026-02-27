#!/bin/bash

echo "=========================================="
echo "远程重置管理员密码"
echo "=========================================="
echo ""

SERVER="root@104.223.59.170"

ssh $SERVER << 'ENDSSH'
cd /root/fuxin

echo "重置管理员密码为: admin123"

# 创建临时重置脚本
cat > reset-password.js << 'EOF'
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('数据库连接失败:', err);
    process.exit(1);
  }
  console.log('数据库连接成功');
});

async function resetPassword() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    db.run(
      'UPDATE Users SET password = ? WHERE username = ?',
      [hashedPassword, 'admin'],
      function(err) {
        if (err) {
          console.error('更新密码失败:', err);
          process.exit(1);
        }
        console.log('管理员密码已重置为: admin123');
        console.log('影响行数:', this.changes);
        db.close();
      }
    );
  } catch (error) {
    console.error('密码加密失败:', error);
    process.exit(1);
  }
}

resetPassword();
EOF

# 运行重置脚本
node reset-password.js

# 删除临时脚本
rm reset-password.js

echo ""
echo "密码重置完成！"
echo "用户名: admin"
echo "密码: admin123"

ENDSSH

echo ""
echo "=========================================="
echo "完成"
echo "=========================================="
