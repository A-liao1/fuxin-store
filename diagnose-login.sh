#!/bin/bash

echo "=========================================="
echo "远程服务器登录问题诊断脚本"
echo "=========================================="
echo ""

SERVER="104.223.59.170"
DOMAIN="https://tkvn.fun"

echo "1. 检查服务器连接..."
ping -c 2 $SERVER

echo ""
echo "2. 检查HTTPS访问..."
curl -I $DOMAIN

echo ""
echo "3. 检查后端健康状态..."
curl -s $DOMAIN/health | jq '.' 2>/dev/null || curl -s $DOMAIN/health

echo ""
echo "4. 检查API验证码接口..."
curl -I $DOMAIN/api/auth/captcha

echo ""
echo "5. 测试登录接口（使用默认管理员账号）..."
curl -X POST $DOMAIN/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","captcha":"test"}' \
  -v

echo ""
echo "=========================================="
echo "诊断完成"
echo "=========================================="
