#!/bin/bash

# 配置数据库备份邮件发送
# 使用 msmtp 发送邮件到 QQ 邮箱

SERVER="root@104.223.59.170"
EMAIL="553011308@qq.com"

echo "=========================================="
echo "配置数据库备份邮件发送"
echo "=========================================="
echo ""

echo "目标邮箱: $EMAIL"
echo ""

# 1. 安装 msmtp 和 msmtp-mta
echo "步骤 1: 安装邮件发送工具..."
ssh $SERVER << 'ENDSSH'
apt-get update
apt-get install -y msmtp msmtp-mta
ENDSSH

echo ""
echo "步骤 2: 配置 msmtp..."
echo ""
echo "⚠️  需要 QQ 邮箱授权码"
echo "获取方式："
echo "1. 登录 QQ 邮箱 (mail.qq.com)"
echo "2. 设置 -> 账户 -> POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
echo "3. 开启 SMTP 服务"
echo "4. 生成授权码"
echo ""

read -p "请输入 QQ 邮箱授权码: " AUTH_CODE

if [ -z "$AUTH_CODE" ]; then
    echo "错误: 未输入授权码"
    exit 1
fi

# 2. 创建 msmtp 配置文件
echo "创建配置文件..."
ssh $SERVER << ENDSSH
# 创建 msmtp 配置
cat > /root/.msmtprc << 'EOF'
# QQ 邮箱配置
defaults
auth           on
tls            on
tls_trust_file /etc/ssl/certs/ca-certificates.crt
logfile        /var/log/msmtp.log

# QQ 邮箱账户
account        qq
host           smtp.qq.com
port           587
from           $EMAIL
user           $EMAIL
password       $AUTH_CODE

# 设置默认账户
account default : qq
EOF

# 设置权限
chmod 600 /root/.msmtprc

# 测试配置
echo "测试邮件配置..."
echo "这是一封测试邮件，用于验证邮件发送功能。

发送时间: \$(date '+%Y-%m-%d %H:%M:%S')
服务器: 104.223.59.170

如果您收到此邮件，说明邮件发送配置成功。" | msmtp --debug $EMAIL

ENDSSH

echo ""
echo "步骤 3: 上传备份脚本..."

# 3. 上传备份脚本
scp backup-and-email.sh $SERVER:/root/

ssh $SERVER << 'ENDSSH'
chmod +x /root/backup-and-email.sh

# 修改脚本使用 msmtp
cat > /root/backup-and-email.sh << 'EOF'
#!/bin/bash

# 数据库备份并发送邮件脚本

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
    
    # 压缩备份文件
    COMPRESSED_FILE="$BACKUP_FILE.gz"
    gzip -c $BACKUP_FILE > $COMPRESSED_FILE
    COMPRESSED_SIZE=$(du -h $COMPRESSED_FILE | cut -f1)
    
    # 使用 base64 编码附件
    ENCODED=$(base64 $COMPRESSED_FILE)
    
    # 发送邮件
    echo "发送备份到邮箱: $EMAIL"
    
    cat << EMAILEOF | msmtp $EMAIL
To: $EMAIL
From: 数据库备份系统 <$EMAIL>
Subject: 数据库备份 - $DATE
Content-Type: multipart/mixed; boundary="BOUNDARY"

--BOUNDARY
Content-Type: text/plain; charset=UTF-8

数据库备份已完成

备份时间: $(date '+%Y-%m-%d %H:%M:%S')
备份文件: database.db.$DATE.bak
原始大小: $SIZE
压缩大小: $COMPRESSED_SIZE

备份文件已作为附件发送。

此邮件由系统自动发送。
--BOUNDARY
Content-Type: application/gzip; name="database.db.$DATE.bak.gz"
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename="database.db.$DATE.bak.gz"

$ENCODED
--BOUNDARY--
EMAILEOF
    
    if [ $? -eq 0 ]; then
        echo "邮件发送成功"
        rm -f $COMPRESSED_FILE
    else
        echo "邮件发送失败"
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
EOF

chmod +x /root/backup-and-email.sh

ENDSSH

echo ""
echo "步骤 4: 配置定时任务..."

# 4. 配置 crontab
ssh $SERVER << 'ENDSSH'
# 添加定时任务（每天凌晨2点执行）
(crontab -l 2>/dev/null | grep -v "backup-and-email.sh"; echo "0 2 * * * /root/backup-and-email.sh >> /var/log/backup.log 2>&1") | crontab -

echo "定时任务已配置:"
crontab -l | grep backup-and-email.sh

ENDSSH

echo ""
echo "步骤 5: 测试备份和邮件发送..."
ssh $SERVER '/root/backup-and-email.sh'

echo ""
echo "=========================================="
echo "配置完成！"
echo "=========================================="
echo ""
echo "定时任务: 每天凌晨 2:00 自动备份并发送邮件"
echo "目标邮箱: $EMAIL"
echo "日志文件: /var/log/backup.log"
echo ""
echo "手动执行备份:"
echo "  ssh $SERVER '/root/backup-and-email.sh'"
echo ""
echo "查看定时任务:"
echo "  ssh $SERVER 'crontab -l'"
echo ""
echo "查看日志:"
echo "  ssh $SERVER 'tail -f /var/log/backup.log'"
echo ""
