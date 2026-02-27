#!/bin/bash

# 生产环境部署脚本（优化版）
# 功能：
# 1. 数据库备份
# 2. 强制停止进程
# 3. 完整部署流程
# 4. 健康检查

set -e  # 遇到错误立即退出

# 配置变量
SERVER="root@104.223.59.170"
DEPLOY_DIR="/root/fuxin"
BACKUP_DIR="/root/backups"
DB_FILE="database.db"
APP_NAME="fuxin"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
    echo ""
}

# 确认部署
confirm_deploy() {
    print_header "生产环境部署确认"
    echo "即将部署到生产服务器: $SERVER"
    echo "部署目录: $DEPLOY_DIR"
    echo ""
    read -p "确认要继续部署吗？(yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_warning "部署已取消"
        exit 0
    fi
}

# 构建后端
build_backend() {
    print_header "步骤 1/7: 构建后端"
    
    cd backend
    print_info "清理旧的构建文件..."
    rm -rf dist
    
    print_info "安装依赖..."
    npm install
    
    print_info "构建后端..."
    npm run build
    
    if [ ! -d "dist" ]; then
        print_error "后端构建失败，dist目录不存在"
        exit 1
    fi
    
    cd ..
    print_success "后端构建完成"
}

# 构建前端
build_frontend() {
    print_header "步骤 2/7: 构建前端"
    
    cd frontend
    print_info "清理旧的构建文件..."
    rm -rf dist
    
    print_info "安装依赖..."
    npm install
    
    print_info "构建前端..."
    npm run build
    
    if [ ! -d "dist" ]; then
        print_error "前端构建失败，dist目录不存在"
        exit 1
    fi
    
    cd ..
    print_success "前端构建完成"
}

# 准备部署包
prepare_deploy_package() {
    print_header "步骤 3/7: 准备部署包"
    
    print_info "清理旧的部署文件..."
    rm -rf deploy/dist
    rm -rf deploy/public
    rm -f deploy.tar.gz
    
    print_info "创建部署目录..."
    mkdir -p deploy/dist
    mkdir -p deploy/public
    
    print_info "复制后端文件..."
    cp -r backend/dist/* deploy/dist/
    cp backend/package.json deploy/
    cp backend/package-lock.json deploy/ 2>/dev/null || true
    
    print_info "复制前端文件..."
    cp -r frontend/dist/* deploy/public/
    
    print_info "复制用户初始化脚本..."
    if [ -f "init-production-users.js" ]; then
        cp init-production-users.js deploy/
        print_success "用户初始化脚本已复制"
    else
        print_warning "未找到用户初始化脚本"
    fi
    
    print_info "创建压缩包..."
    cd deploy
    tar -czf ../deploy.tar.gz .
    cd ..
    
    print_success "部署包准备完成: deploy.tar.gz"
}

# 上传到服务器
upload_to_server() {
    print_header "步骤 4/7: 上传到服务器"
    
    print_info "上传部署包到服务器..."
    scp deploy.tar.gz $SERVER:/tmp/deploy-$(date +%Y%m%d_%H%M%S).tar.gz
    scp deploy.tar.gz $SERVER:/tmp/deploy-latest.tar.gz
    
    print_success "上传完成"
}

# 在服务器上执行部署
deploy_on_server() {
    print_header "步骤 5/7: 服务器端部署"
    
    ssh $SERVER << 'ENDSSH'
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

DEPLOY_DIR="/root/fuxin"
BACKUP_DIR="/root/backups"
DB_FILE="database.db"
APP_NAME="fuxin"

# 创建备份目录
print_info "创建备份目录..."
mkdir -p $BACKUP_DIR

# 备份数据库
if [ -f "$DEPLOY_DIR/$DB_FILE" ]; then
    BACKUP_FILE="$BACKUP_DIR/${DB_FILE}.$(date +%Y%m%d_%H%M%S).bak"
    print_info "备份数据库: $BACKUP_FILE"
    cp "$DEPLOY_DIR/$DB_FILE" "$BACKUP_FILE"
    
    # 保留最近10个备份
    print_info "清理旧备份（保留最近10个）..."
    cd $BACKUP_DIR
    ls -t ${DB_FILE}.*.bak | tail -n +11 | xargs -r rm
    
    print_success "数据库备份完成"
elif [ -f "/root/deploy/$DB_FILE" ]; then
    # 如果新目录没有，但旧目录有，从旧目录备份
    BACKUP_FILE="$BACKUP_DIR/${DB_FILE}.$(date +%Y%m%d_%H%M%S).bak"
    print_info "从旧部署目录备份数据库: $BACKUP_FILE"
    cp "/root/deploy/$DB_FILE" "$BACKUP_FILE"
    print_success "数据库备份完成"
else
    print_warning "数据库文件不存在，跳过备份"
fi

# 停止服务
print_info "停止现有服务..."

# 尝试使用PM2停止
if command -v pm2 &> /dev/null; then
    pm2 stop $APP_NAME 2>/dev/null || print_warning "PM2未找到运行中的服务"
    pm2 delete $APP_NAME 2>/dev/null || print_warning "PM2未找到服务配置"
fi

# 强制杀死相关进程
print_info "检查并清理残留进程..."
PIDS=$(ps aux | grep -E "node.*dist/index.js|node.*fuxin" | grep -v grep | awk '{print $2}')
if [ ! -z "$PIDS" ]; then
    print_warning "发现残留进程，强制终止: $PIDS"
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# 检查端口占用
print_info "检查端口3001占用情况..."
PORT_PID=$(lsof -ti:3001 2>/dev/null || true)
if [ ! -z "$PORT_PID" ]; then
    print_warning "端口3001被进程 $PORT_PID 占用，强制终止"
    kill -9 $PORT_PID 2>/dev/null || true
    sleep 2
fi

print_success "服务已停止"

# 备份当前部署
if [ -d "$DEPLOY_DIR" ]; then
    BACKUP_DEPLOY="$DEPLOY_DIR.backup.$(date +%Y%m%d_%H%M%S)"
    print_info "备份当前部署到: $BACKUP_DEPLOY"
    cp -r "$DEPLOY_DIR" "$BACKUP_DEPLOY"
    
    # 保留数据库文件
    if [ -f "$DEPLOY_DIR/$DB_FILE" ]; then
        print_info "保留数据库文件..."
        cp "$DEPLOY_DIR/$DB_FILE" "/tmp/${DB_FILE}.keep"
    elif [ -f "/root/deploy/$DB_FILE" ]; then
        # 如果新目录没有，但旧目录有，从旧目录保留
        print_info "从旧部署目录保留数据库文件..."
        cp "/root/deploy/$DB_FILE" "/tmp/${DB_FILE}.keep"
    fi
    
    # 清理旧的备份部署（保留最近5个）
    print_info "清理旧的部署备份（保留最近5个）..."
    cd /root
    ls -dt ${DEPLOY_DIR##*/}.backup.* 2>/dev/null | tail -n +6 | xargs -r rm -rf
fi

# 解压新版本
print_info "解压新版本..."
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"
tar -xzf /tmp/deploy-latest.tar.gz

# 恢复数据库文件
if [ -f "/tmp/${DB_FILE}.keep" ]; then
    print_info "恢复数据库文件..."
    cp "/tmp/${DB_FILE}.keep" "$DEPLOY_DIR/$DB_FILE"
    rm "/tmp/${DB_FILE}.keep"
    chmod 644 "$DEPLOY_DIR/$DB_FILE"
fi

# 安装依赖
print_info "安装生产依赖..."
npm install --production --no-optional

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2未安装，正在安装..."
    npm install -g pm2
fi

# 初始化用户（如果脚本存在）
if [ -f "init-production-users.js" ]; then
    print_info "初始化用户账户..."
    node init-production-users.js || print_warning "用户初始化失败，但继续部署"
else
    print_warning "未找到用户初始化脚本"
fi

# 启动服务
print_info "启动服务..."
NODE_ENV=production pm2 start dist/index.js --name $APP_NAME --time --env production

# 保存PM2配置
pm2 save

# 设置PM2开机自启
pm2 startup || true

print_success "服务启动完成"

# 等待服务启动
print_info "等待服务启动..."
sleep 5

ENDSSH

    print_success "服务器端部署完成"
}

# 健康检查
health_check() {
    print_header "步骤 6/7: 健康检查"
    
    print_info "检查服务状态..."
    ssh $SERVER << 'ENDSSH'
print_info() { echo -e "\033[0;34m[INFO]\033[0m $1"; }
print_success() { echo -e "\033[0;32m[SUCCESS]\033[0m $1"; }
print_error() { echo -e "\033[0;31m[ERROR]\033[0m $1"; }

APP_NAME="fuxin"

# 检查PM2状态
print_info "PM2服务状态:"
pm2 status $APP_NAME

# 检查进程
print_info "检查进程..."
if ps aux | grep -E "node.*dist/index.js" | grep -v grep > /dev/null; then
    print_success "服务进程运行正常"
else
    print_error "服务进程未找到"
    exit 1
fi

# 检查端口
print_info "检查端口3001..."
if lsof -i:3001 > /dev/null 2>&1; then
    print_success "端口3001正在监听"
else
    print_error "端口3001未监听"
    exit 1
fi

# 检查HTTP响应
print_info "检查HTTP响应..."
if curl -s http://localhost:3001/health > /dev/null; then
    print_success "HTTP健康检查通过"
else
    print_error "HTTP健康检查失败"
    exit 1
fi

# 显示最近日志
print_info "最近的服务日志:"
pm2 logs $APP_NAME --lines 10 --nostream

ENDSSH

    if [ $? -eq 0 ]; then
        print_success "健康检查通过"
    else
        print_error "健康检查失败"
        exit 1
    fi
}

# 显示部署信息
show_deploy_info() {
    print_header "步骤 7/7: 部署完成"
    
    print_success "部署成功完成！"
    echo ""
    echo "服务信息："
    echo "  - 服务器: $SERVER"
    echo "  - 部署目录: $DEPLOY_DIR"
    echo "  - 应用名称: $APP_NAME"
    echo "  - 访问地址: https://tkvn.fun"
    echo ""
    echo "数据库备份："
    echo "  - 备份目录: $BACKUP_DIR"
    echo "  - 备份文件: ${DB_FILE}.$(date +%Y%m%d)_*.bak"
    echo ""
    echo "常用命令："
    echo "  - 查看日志: ssh $SERVER 'pm2 logs $APP_NAME'"
    echo "  - 查看状态: ssh $SERVER 'pm2 status'"
    echo "  - 重启服务: ssh $SERVER 'pm2 restart $APP_NAME'"
    echo "  - 停止服务: ssh $SERVER 'pm2 stop $APP_NAME'"
    echo ""
    echo "默认管理员账号："
    echo "  - 用户名: admin"
    echo "  - 密码: admin123"
    echo ""
}

# 主流程
main() {
    print_header "生产环境部署脚本"
    
    # 确认部署
    confirm_deploy
    
    # 构建
    build_backend
    build_frontend
    
    # 准备部署包
    prepare_deploy_package
    
    # 上传
    upload_to_server
    
    # 部署
    deploy_on_server
    
    # 健康检查
    health_check
    
    # 显示信息
    show_deploy_info
}

# 错误处理
trap 'print_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主流程
main
