#!/bin/bash

echo "======================================"
echo "测试后端接口认证"
echo "======================================"
echo ""

BASE_URL="http://localhost:3001"

echo "1. 测试未认证访问（应该返回 401）"
echo "--------------------------------------"
echo "请求: GET $BASE_URL/api/products"
curl -s $BASE_URL/api/products | jq '.' || curl -s $BASE_URL/api/products
echo ""
echo ""

echo "2. 测试登录接口"
echo "--------------------------------------"
echo "请求: POST $BASE_URL/api/auth/login"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

echo "$LOGIN_RESPONSE" | jq '.' || echo "$LOGIN_RESPONSE"
echo ""

# 提取 token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo "✓ 登录成功，获取到 token"
  echo ""
  
  echo "3. 测试已认证访问（应该返回数据）"
  echo "--------------------------------------"
  echo "请求: GET $BASE_URL/api/products"
  echo "Authorization: Bearer ${TOKEN:0:20}..."
  curl -s $BASE_URL/api/products \
    -H "Authorization: Bearer $TOKEN" | jq '.' || curl -s $BASE_URL/api/products -H "Authorization: Bearer $TOKEN"
  echo ""
  echo ""
  
  echo "4. 测试仪表盘接口"
  echo "--------------------------------------"
  echo "请求: GET $BASE_URL/api/dashboard"
  curl -s $BASE_URL/api/dashboard \
    -H "Authorization: Bearer $TOKEN" | jq '.' || curl -s $BASE_URL/api/dashboard -H "Authorization: Bearer $TOKEN"
  echo ""
else
  echo "✗ 登录失败，无法获取 token"
  echo "请确保："
  echo "  1. 后端服务已启动"
  echo "  2. 管理员账号存在（admin/admin123）"
  echo "  3. 数据库连接正常"
fi

echo ""
echo "======================================"
echo "测试完成"
echo "======================================"
