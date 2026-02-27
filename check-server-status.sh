#!/bin/bash

echo "=========================================="
echo "检查服务器状态"
echo "=========================================="
echo ""

SERVER="root@104.223.59.170"

ssh $SERVER << 'ENDSSH'
echo "1. 检查PM2进程状态..."
pm2 status

echo ""
echo "2. 检查fuxin服务日志（最近50行）..."
pm2 logs fuxin --lines 50 --nostream

echo ""
echo "3. 检查端口3001是否在监听..."
netstat -tlnp | grep 3001 || ss -tlnp | grep 3001

echo ""
echo "4. 测试本地API健康检查..."
curl -s http://localhost:3001/health

echo ""
echo "5. 测试本地登录接口..."
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","captcha":"test"}' \
  2>&1

echo ""
echo "6. 检查nginx状态..."
systemctl status nginx | head -20

echo ""
echo "7. 检查nginx配置..."
nginx -t

echo ""
echo "8. 检查数据库文件..."
ls -lh /root/fuxin/database.db 2>/dev/null || echo "数据库文件不存在"

echo ""
echo "9. 检查部署目录结构..."
ls -lh /root/fuxin/

echo ""
echo "10. 检查前端文件..."
ls -lh /var/www/fuxin/ | head -10

ENDSSH

echo ""
echo "=========================================="
echo "检查完成"
echo "=========================================="
