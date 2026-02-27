#!/bin/bash

# 数据库备份并发送邮件脚本

# 配置
DB_FILE="/root/fuxin/database.db"
BACKUP_DIR="/root/backups"
EMAIL="553011308@qq.com"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/database.db.$DATE.bak"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
echo "开始备份数据库..."
cp $DB_FILE $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "数据库备份成功: $BACKUP_FILE"
    
    # 获取备份文件大小
    SIZE=$(du -h $BACKUP_FILE | cut -f1)
    
    # 发送邮件
    echo "发送备份到邮箱: $EMAIL"
    
    # 使用 mail 命令发送（需要安装 mailutils）
    if command -v mail &> /dev/null; then
        echo "数据库备份文件已创建
        
备份时间: $(date '+%Y-%m-%d %H:%M:%S')
备份文件: $BACKUP_FILE
文件大小: $SIZE

此邮件由系统自动发送。" | mail -s "数据库备份 - $DATE" -A $BACKUP_FILE $EMAIL
        
        if [ $? -eq 0 ]; then
            echo "邮件发送成功"
        else
            echo "邮件发送失败"
        fi
    else
        echo "未安装 mail 命令，尝试使用 sendmail..."
        
        # 使用 sendmail（需要配置 SMTP）
        if command -v sendmail &> /dev/null; then
            # 创建临时邮件文件
            MAIL_FILE="/tmp/backup_email_$DATE.txt"
            
            cat > $MAIL_FILE << EOF
To: $EMAIL
Subject: 数据库备份 - $DATE
Content-Type: text/plain; charset=UTF-8

数据库备份文件已创建

备份时间: $(date '+%Y-%m-%d %H:%M:%S')
备份文件: $BACKUP_FILE
文件大小: $SIZE

请登录服务器下载备份文件：
ssh root@104.223.59.170
cd $BACKUP_DIR

此邮件由系统自动发送。
EOF
            
            sendmail $EMAIL < $MAIL_FILE
            rm -f $MAIL_FILE
            echo "邮件已发送（sendmail）"
        else
            echo "未找到邮件发送工具，请手动配置"
        fi
    fi
    
    # 清理旧备份（保留最近30个）
    echo "清理旧备份..."
    cd $BACKUP_DIR
    ls -t database.db.*.bak | tail -n +31 | xargs -r rm
    echo "备份清理完成"
    
else
    echo "数据库备份失败"
    exit 1
fi

echo "备份任务完成"
