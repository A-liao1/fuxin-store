#!/bin/bash

# 数据库管理脚本
# 功能：备份、恢复、查看数据库

SERVER="root@104.223.59.170"
DEPLOY_DIR="/root/fuxin"
BACKUP_DIR="/root/backups"
DB_FILE="database.db"
LOCAL_BACKUP_DIR="./database-backups"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 显示菜单
show_menu() {
    print_header "数据库管理工具"
    echo "1. 备份生产数据库到本地"
    echo "2. 查看服务器上的备份列表"
    echo "3. 恢复数据库（从服务器备份）"
    echo "4. 上传本地数据库到服务器"
    echo "5. 下载生产数据库到本地"
    echo "6. 清理旧备份"
    echo "7. 退出"
    echo ""
}

# 备份生产数据库到本地
backup_to_local() {
    print_header "备份生产数据库到本地"
    
    mkdir -p $LOCAL_BACKUP_DIR
    
    BACKUP_FILE="$LOCAL_BACKUP_DIR/${DB_FILE}.$(date +%Y%m%d_%H%M%S).bak"
    
    print_info "从服务器下载数据库..."
    scp $SERVER:$DEPLOY_DIR/$DB_FILE $BACKUP_FILE
    
    if [ $? -eq 0 ]; then
        print_success "备份完成: $BACKUP_FILE"
        
        # 显示文件大小
        SIZE=$(du -h $BACKUP_FILE | cut -f1)
        print_info "文件大小: $SIZE"
    else
        print_error "备份失败"
        return 1
    fi
}

# 查看服务器备份列表
list_server_backups() {
    print_header "服务器备份列表"
    
    ssh $SERVER << ENDSSH
if [ -d "$BACKUP_DIR" ]; then
    echo "备份目录: $BACKUP_DIR"
    echo ""
    ls -lh $BACKUP_DIR/${DB_FILE}.*.bak 2>/dev/null | awk '{print \$9, \$5, \$6, \$7, \$8}' || echo "没有找到备份文件"
else
    echo "备份目录不存在"
fi
ENDSSH
}

# 恢复数据库
restore_database() {
    print_header "恢复数据库"
    
    print_warning "此操作将替换当前生产数据库！"
    read -p "确认要继续吗？(yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_warning "操作已取消"
        return 0
    fi
    
    # 获取备份列表
    print_info "获取备份列表..."
    ssh $SERVER "ls -t $BACKUP_DIR/${DB_FILE}.*.bak 2>/dev/null" > /tmp/backup_list.txt
    
    if [ ! -s /tmp/backup_list.txt ]; then
        print_error "没有找到备份文件"
        return 1
    fi
    
    echo ""
    echo "可用的备份："
    cat /tmp/backup_list.txt | nl
    echo ""
    
    read -p "请选择要恢复的备份编号: " backup_num
    
    BACKUP_FILE=$(sed -n "${backup_num}p" /tmp/backup_list.txt)
    
    if [ -z "$BACKUP_FILE" ]; then
        print_error "无效的备份编号"
        return 1
    fi
    
    print_info "将恢复备份: $BACKUP_FILE"
    read -p "最后确认，确定要恢复吗？(yes/no): " final_confirm
    
    if [ "$final_confirm" != "yes" ]; then
        print_warning "操作已取消"
        return 0
    fi
    
    ssh $SERVER << ENDSSH
set -e

APP_NAME="fuxin"
BACKUP_FILE="$BACKUP_FILE"

echo "停止服务..."
pm2 stop \$APP_NAME 2>/dev/null || true

echo "备份当前数据库..."
cp $DEPLOY_DIR/$DB_FILE $DEPLOY_DIR/${DB_FILE}.before_restore.bak

echo "恢复数据库..."
cp "\$BACKUP_FILE" $DEPLOY_DIR/$DB_FILE
chmod 644 $DEPLOY_DIR/$DB_FILE

echo "启动服务..."
pm2 start \$APP_NAME

echo "恢复完成"
ENDSSH
    
    if [ $? -eq 0 ]; then
        print_success "数据库恢复完成"
    else
        print_error "数据库恢复失败"
        return 1
    fi
}

# 上传本地数据库
upload_database() {
    print_header "上传本地数据库到服务器"
    
    print_warning "此操作将替换生产数据库！"
    read -p "确认要继续吗？(yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_warning "操作已取消"
        return 0
    fi
    
    # 选择本地数据库文件
    if [ -f "backend/$DB_FILE" ]; then
        LOCAL_DB="backend/$DB_FILE"
    else
        read -p "请输入本地数据库文件路径: " LOCAL_DB
        if [ ! -f "$LOCAL_DB" ]; then
            print_error "文件不存在: $LOCAL_DB"
            return 1
        fi
    fi
    
    print_info "将上传: $LOCAL_DB"
    read -p "最后确认，确定要上传吗？(yes/no): " final_confirm
    
    if [ "$final_confirm" != "yes" ]; then
        print_warning "操作已取消"
        return 0
    fi
    
    # 上传到临时位置
    print_info "上传数据库文件..."
    scp "$LOCAL_DB" $SERVER:/tmp/${DB_FILE}.upload
    
    # 在服务器上替换
    ssh $SERVER << ENDSSH
set -e

APP_NAME="fuxin"

echo "停止服务..."
pm2 stop \$APP_NAME 2>/dev/null || true

echo "备份当前数据库..."
cp $DEPLOY_DIR/$DB_FILE $BACKUP_DIR/${DB_FILE}.$(date +%Y%m%d_%H%M%S).before_upload.bak

echo "替换数据库..."
mv /tmp/${DB_FILE}.upload $DEPLOY_DIR/$DB_FILE
chmod 644 $DEPLOY_DIR/$DB_FILE

echo "启动服务..."
pm2 start \$APP_NAME

echo "上传完成"
ENDSSH
    
    if [ $? -eq 0 ]; then
        print_success "数据库上传完成"
    else
        print_error "数据库上传失败"
        return 1
    fi
}

# 下载生产数据库
download_database() {
    print_header "下载生产数据库到本地"
    
    mkdir -p $LOCAL_BACKUP_DIR
    
    LOCAL_FILE="$LOCAL_BACKUP_DIR/${DB_FILE}.production.$(date +%Y%m%d_%H%M%S)"
    
    print_info "下载数据库..."
    scp $SERVER:$DEPLOY_DIR/$DB_FILE $LOCAL_FILE
    
    if [ $? -eq 0 ]; then
        print_success "下载完成: $LOCAL_FILE"
        
        # 显示文件大小
        SIZE=$(du -h $LOCAL_FILE | cut -f1)
        print_info "文件大小: $SIZE"
        
        # 询问是否替换本地开发数据库
        read -p "是否替换本地开发数据库？(yes/no): " replace
        if [ "$replace" = "yes" ]; then
            cp $LOCAL_FILE backend/$DB_FILE
            print_success "已替换本地开发数据库"
        fi
    else
        print_error "下载失败"
        return 1
    fi
}

# 清理旧备份
cleanup_backups() {
    print_header "清理旧备份"
    
    echo "1. 清理服务器备份"
    echo "2. 清理本地备份"
    echo "3. 返回"
    echo ""
    read -p "请选择: " choice
    
    case $choice in
        1)
            read -p "保留最近多少个备份？(默认10): " keep_count
            keep_count=${keep_count:-10}
            
            ssh $SERVER << ENDSSH
cd $BACKUP_DIR
TOTAL=\$(ls -t ${DB_FILE}.*.bak 2>/dev/null | wc -l)
echo "当前备份总数: \$TOTAL"
echo "保留最近 $keep_count 个备份"

if [ \$TOTAL -gt $keep_count ]; then
    REMOVE=\$((TOTAL - $keep_count))
    echo "将删除 \$REMOVE 个旧备份"
    ls -t ${DB_FILE}.*.bak | tail -n +$((keep_count + 1)) | xargs rm -v
    echo "清理完成"
else
    echo "备份数量未超过限制，无需清理"
fi
ENDSSH
            ;;
        2)
            if [ -d "$LOCAL_BACKUP_DIR" ]; then
                TOTAL=$(ls -t $LOCAL_BACKUP_DIR/${DB_FILE}.*.bak 2>/dev/null | wc -l)
                echo "当前本地备份总数: $TOTAL"
                
                read -p "保留最近多少个备份？(默认5): " keep_count
                keep_count=${keep_count:-5}
                
                if [ $TOTAL -gt $keep_count ]; then
                    REMOVE=$((TOTAL - keep_count))
                    echo "将删除 $REMOVE 个旧备份"
                    ls -t $LOCAL_BACKUP_DIR/${DB_FILE}.*.bak | tail -n +$((keep_count + 1)) | xargs rm -v
                    print_success "清理完成"
                else
                    print_info "备份数量未超过限制，无需清理"
                fi
            else
                print_warning "本地备份目录不存在"
            fi
            ;;
        3)
            return 0
            ;;
        *)
            print_error "无效的选项"
            ;;
    esac
}

# 主循环
main() {
    while true; do
        show_menu
        read -p "请选择操作 (1-7): " choice
        
        case $choice in
            1)
                backup_to_local
                ;;
            2)
                list_server_backups
                ;;
            3)
                restore_database
                ;;
            4)
                upload_database
                ;;
            5)
                download_database
                ;;
            6)
                cleanup_backups
                ;;
            7)
                print_info "退出"
                exit 0
                ;;
            *)
                print_error "无效的选项"
                ;;
        esac
        
        echo ""
        read -p "按回车键继续..."
    done
}

# 执行主程序
main
