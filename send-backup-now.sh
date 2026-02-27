#!/bin/bash

# 立即发送数据库备份到邮箱

SERVER="root@104.223.59.170"
EMAIL="553011308@qq.com"
DATE=$(date +%Y%m%d_%H%M%S)

echo "=========================================="
echo "发送数据库备份到邮箱"
echo "=========================================="
echo ""

# 1. 从服务器下载最新备份
echo "步骤 1: 下载最新备份..."
LATEST_BACKUP=$(ssh $SERVER 'ls -t /root/backups/database.db.*.bak 2>/dev/null | head -1')

if [ -z "$LATEST_BACKUP" ]; then
    echo "未找到备份文件，创建新备份..."
    ssh $SERVER 'mkdir -p /root/backups && cp /root/fuxin/database.db /root/backups/database.db.'$DATE'.bak'
    LATEST_BACKUP="/root/backups/database.db.$DATE.bak"
fi

echo "最新备份: $LATEST_BACKUP"

# 下载到本地
LOCAL_BACKUP="/tmp/database_backup_$DATE.db"
scp $SERVER:$LATEST_BACKUP $LOCAL_BACKUP

if [ $? -ne 0 ]; then
    echo "下载备份失败"
    exit 1
fi

echo "备份已下载到: $LOCAL_BACKUP"

# 2. 获取备份信息
SIZE=$(du -h $LOCAL_BACKUP | cut -f1)
echo "备份大小: $SIZE"

# 3. 压缩备份
echo ""
echo "步骤 2: 压缩备份文件..."
COMPRESSED_FILE="$LOCAL_BACKUP.gz"
gzip -c $LOCAL_BACKUP > $COMPRESSED_FILE
COMPRESSED_SIZE=$(du -h $COMPRESSED_FILE | cut -f1)
echo "压缩后大小: $COMPRESSED_SIZE"

# 4. 使用 Python 发送邮件（更可靠）
echo ""
echo "步骤 3: 发送邮件到 $EMAIL ..."

python3 << 'PYTHON_SCRIPT'
import smtplib
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime

# 配置
sender_email = "553011308@qq.com"
receiver_email = "553011308@qq.com"
smtp_server = "smtp.qq.com"
smtp_port = 587

# 获取授权码
print("请输入 QQ 邮箱授权码（不是密码）:")
print("获取方式: QQ邮箱 -> 设置 -> 账户 -> POP3/SMTP服务 -> 生成授权码")
password = input("授权码: ").strip()

if not password:
    print("错误: 未输入授权码")
    sys.exit(1)

# 创建邮件
msg = MIMEMultipart()
msg['From'] = f"数据库备份系统 <{sender_email}>"
msg['To'] = receiver_email
msg['Subject'] = f"数据库备份 - {datetime.now().strftime('%Y%m%d_%H%M%S')}"

# 邮件正文
body = f"""数据库备份已完成

备份时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
服务器: 104.223.59.170
备份文件: 见附件

此邮件由系统自动发送。
"""

msg.attach(MIMEText(body, 'plain', 'utf-8'))

# 添加附件
import os
compressed_file = os.environ.get('COMPRESSED_FILE')
if compressed_file and os.path.exists(compressed_file):
    filename = os.path.basename(compressed_file)
    with open(compressed_file, 'rb') as f:
        part = MIMEBase('application', 'gzip')
        part.set_payload(f.read())
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', f'attachment; filename={filename}')
        msg.attach(part)
    print(f"附件已添加: {filename}")

# 发送邮件
try:
    print("连接到 SMTP 服务器...")
    server = smtplib.SMTP(smtp_server, smtp_port)
    server.starttls()
    
    print("登录邮箱...")
    server.login(sender_email, password)
    
    print("发送邮件...")
    server.send_message(msg)
    server.quit()
    
    print("✓ 邮件发送成功！")
    print(f"✓ 备份已发送到: {receiver_email}")
    
except Exception as e:
    print(f"✗ 邮件发送失败: {e}")
    sys.exit(1)

PYTHON_SCRIPT

# 5. 清理临时文件
echo ""
echo "步骤 4: 清理临时文件..."
rm -f $LOCAL_BACKUP $COMPRESSED_FILE

echo ""
echo "=========================================="
echo "完成！"
echo "=========================================="
echo ""
echo "请检查邮箱: $EMAIL"
echo ""
