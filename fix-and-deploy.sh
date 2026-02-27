#!/bin/bash

echo "=========================================="
echo "修复登录问题并重新部署"
echo "=========================================="
echo ""

# 设置变量
SERVER="root@104.223.59.170"
DEPLOY_DIR="/root/fuxin"
WEB_DIR="/var/www/fuxin"

echo "1. 重新构建后端..."
cd backend
npm run build
cd ..

echo ""
echo "2. 重新构建前端..."
cd frontend
npm run build
cd ..

echo ""
echo "3. 准备部署包..."
rm -rf deploy/dist
rm -rf deploy/public
mkdir -p deploy/dist
mkdir -p deploy/public

# 复制后端文件
cp -r backend/dist/* deploy/dist/
cp backend/package.json deploy/
cp backend/database.db deploy/ 2>/dev/null || echo "数据库文件不存在，将在服务器上创建"

# 复制前端文件
cp -r frontend/dist/* deploy/public/

echo ""
echo "4. 创建部署压缩包..."
cd deploy
tar -czf ../deploy-fix.tar.gz .
cd ..

echo ""
echo "5. 上传到服务器..."
scp deploy-fix.tar.gz $SERVER:/tmp/

echo ""
echo "6. 在服务器上部署..."
ssh $SERVER << 'ENDSSH'
set -e

echo "停止现有服务..."
pm2 stop fuxin || echo "服务未运行"

echo "备份当前部署..."
cd /root
if [ -d "fuxin" ]; then
  mv fuxin fuxin.backup.$(date +%Y%m%d_%H%M%S)
fi

echo "解压新版本..."
mkdir -p fuxin
cd fuxin
tar -xzf /tmp/deploy-fix.tar.gz

echo "安装依赖..."
npm install --production

echo "启动服务..."
pm2 start dist/index.js --name fuxin --time

echo "查看服务状态..."
pm2 status

echo "查看最近日志..."
pm2 logs fuxin --lines 20 --nostream

echo ""
echo "部署完成！"
ENDSSH

echo ""
echo "=========================================="
echo "部署完成！请访问 https://tkvn.fun 测试"
echo "=========================================="
echo ""
echo "默认管理员账号："
echo "用户名: admin"
echo "密码: admin123"
echo ""
echo "如需查看服务器日志，运行："
echo "ssh $SERVER 'pm2 logs fuxin'"
