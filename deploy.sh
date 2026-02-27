#!/bin/bash

# 部署脚本

echo "开始部署项目..."

# 创建部署目录
DEPLOY_DIR="./deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# 复制后端文件
echo "复制后端文件..."
cp -r ./backend/dist $DEPLOY_DIR/
cp ./backend/package.json $DEPLOY_DIR/
cp ./backend/package-lock.json $DEPLOY_DIR/

# 复制前端构建文件
echo "复制前端构建文件..."
mkdir -p $DEPLOY_DIR/public
cp -r ./frontend/dist/* $DEPLOY_DIR/public/

# 创建启动脚本
echo "创建启动脚本..."
cat > $DEPLOY_DIR/start.sh << 'EOF'
#!/bin/bash

# 启动脚本

echo "安装依赖..."
npm install --production

echo "启动服务..."
npm start
EOF

chmod +x $DEPLOY_DIR/start.sh

# 压缩部署文件
echo "压缩部署文件..."
cd $DEPLOY_DIR
tar -czf ../deploy.tar.gz .
cd ..

# 上传到生产服务器
echo "上传到生产服务器..."
scp ./deploy.tar.gz root@104.223.59.170:/root/

# 登录服务器并部署
echo "登录服务器并部署..."
ssh root@104.223.59.170 << 'EOF'

# 在服务器上执行的命令

# 备份数据库文件
if [ -f /root/deploy/database.db ]; then
    echo "备份数据库文件..."
    cp /root/deploy/database.db /root/database.db.bak
    echo "数据库备份成功: /root/database.db.bak"
fi

# 创建临时目录解压文件
rm -rf /root/deploy_temp
mkdir -p /root/deploy_temp
cd /root/deploy_temp
tar -xzf ../deploy.tar.gz

# 如果部署目录存在，保留数据库文件
if [ -d /root/deploy ]; then
    echo "保留现有数据库文件..."
    # 复制新文件到部署目录，跳过数据库文件
    cp -r /root/deploy_temp/* /root/deploy/
    # 确保数据库文件权限正确
    if [ -f /root/deploy/database.db ]; then
        chmod 644 /root/deploy/database.db
    fi
else
    echo "创建新的部署目录..."
    mv /root/deploy_temp /root/deploy
fi

# 清理临时目录
rm -rf /root/deploy_temp

# 安装Node.js和npm（如果没有）
if ! command -v npm &> /dev/null; then
    echo "安装Node.js..."
    apt update && apt install -y nodejs npm
fi

# 启动服务
echo "重启服务..."
cd /root/deploy
chmod +x start.sh

# 检查是否有正在运行的进程
if ps aux | grep "node dist/index.js" | grep -v grep > /dev/null; then
    echo "停止现有服务..."
    pkill -f "node dist/index.js"
    sleep 2
fi

# 启动新服务
./start.sh

EOF

echo "部署完成！"
