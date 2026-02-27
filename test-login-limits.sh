#!/bin/bash

# 测试登录错误限制功能

echo "=========================================="
echo "测试登录错误限制功能"
echo "=========================================="
echo ""

# 1. 重置所有登录记录
echo "1. 重置登录记录..."
curl -s -X POST https://tkvn.fun/api/auth/reset-login-attempts \
  -H "Content-Type: application/json" \
  -d '{"ip":"all"}'
echo ""
echo ""

# 2. 测试错误登录（用户名不存在）
echo "2. 测试错误登录（用户名不存在）..."
for i in {1..3}; do
  echo "尝试 $i:"
  curl -s -X POST https://tkvn.fun/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"wronguser","password":"wrongpass"}'
  echo ""
  sleep 1
done
echo ""

# 3. 测试错误登录（用户名正确，密码错误）
echo "3. 测试错误登录（用户名正确，密码错误）..."
for i in {1..3}; do
  echo "尝试 $i:"
  curl -s -X POST https://tkvn.fun/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrongpassword"}'
  echo ""
  sleep 1
done
echo ""

# 4. 查看当前登录尝试记录
echo "4. 查看当前登录尝试记录..."
curl -s https://tkvn.fun/api/auth/login-attempts | python3 -m json.tool
echo ""
echo ""

# 5. 继续错误登录直到锁定
echo "5. 继续错误登录直到锁定..."
for i in {1..5}; do
  echo "尝试 $i:"
  curl -s -X POST https://tkvn.fun/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser","password":"wrongpass"}'
  echo ""
  sleep 1
done
echo ""

# 6. 验证锁定状态
echo "6. 验证锁定状态（应该被拒绝）..."
curl -s -X POST https://tkvn.fun/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"wrongpass"}'
echo ""
echo ""

echo "=========================================="
echo "测试完成"
echo "=========================================="
