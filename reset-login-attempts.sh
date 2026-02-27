#!/bin/bash

BASE_URL="http://localhost:3001"

echo "======================================"
echo "登录尝试记录管理工具"
echo "======================================"
echo ""

# 显示菜单
echo "请选择操作："
echo "1. 查看所有登录尝试记录"
echo "2. 重置指定IP的登录尝试记录"
echo "3. 清除所有登录尝试记录"
echo "4. 退出"
echo ""

read -p "请输入选项 (1-4): " choice

case $choice in
  1)
    echo ""
    echo "正在查询登录尝试记录..."
    echo "--------------------------------------"
    curl -s $BASE_URL/api/auth/login-attempts | jq '.' || curl -s $BASE_URL/api/auth/login-attempts
    ;;
  2)
    echo ""
    read -p "请输入要重置的IP地址: " ip
    echo ""
    echo "正在重置IP $ip 的登录尝试记录..."
    echo "--------------------------------------"
    curl -s -X POST $BASE_URL/api/auth/reset-login-attempts \
      -H "Content-Type: application/json" \
      -d "{\"ip\":\"$ip\"}" | jq '.' || curl -s -X POST $BASE_URL/api/auth/reset-login-attempts \
      -H "Content-Type: application/json" \
      -d "{\"ip\":\"$ip\"}"
    ;;
  3)
    echo ""
    read -p "确定要清除所有登录尝试记录吗？(y/n): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
      echo ""
      echo "正在清除所有登录尝试记录..."
      echo "--------------------------------------"
      curl -s -X POST $BASE_URL/api/auth/reset-login-attempts \
        -H "Content-Type: application/json" \
        -d '{"ip":"all"}' | jq '.' || curl -s -X POST $BASE_URL/api/auth/reset-login-attempts \
        -H "Content-Type: application/json" \
        -d '{"ip":"all"}'
    else
      echo "已取消操作"
    fi
    ;;
  4)
    echo "退出"
    exit 0
    ;;
  *)
    echo "无效的选项"
    exit 1
    ;;
esac

echo ""
echo "======================================"
echo "操作完成"
echo "======================================"
