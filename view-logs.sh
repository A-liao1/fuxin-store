#!/bin/bash

# 服务器日志查看工具

SERVER="root@104.223.59.170"
APP_NAME="fuxin"

echo "=========================================="
echo "服务器日志查看工具"
echo "=========================================="
echo ""
echo "选择查看方式："
echo "1. 查看最近50行日志"
echo "2. 查看最近100行日志"
echo "3. 查看最近200行日志"
echo "4. 实时监控日志（Ctrl+C退出）"
echo "5. 只查看错误日志"
echo "6. 只查看输出日志"
echo "7. 查看登录相关日志"
echo "8. 查看数据库查询日志"
echo ""
read -p "请选择 (1-8): " choice

case $choice in
    1)
        echo ""
        echo "=== 最近50行日志 ==="
        ssh $SERVER "pm2 logs $APP_NAME --lines 50 --nostream"
        ;;
    2)
        echo ""
        echo "=== 最近100行日志 ==="
        ssh $SERVER "pm2 logs $APP_NAME --lines 100 --nostream"
        ;;
    3)
        echo ""
        echo "=== 最近200行日志 ==="
        ssh $SERVER "pm2 logs $APP_NAME --lines 200 --nostream"
        ;;
    4)
        echo ""
        echo "=== 实时监控日志（按Ctrl+C退出）==="
        ssh $SERVER "pm2 logs $APP_NAME"
        ;;
    5)
        echo ""
        echo "=== 错误日志 ==="
        ssh $SERVER "pm2 logs $APP_NAME --err --lines 50 --nostream"
        ;;
    6)
        echo ""
        echo "=== 输出日志 ==="
        ssh $SERVER "pm2 logs $APP_NAME --out --lines 50 --nostream"
        ;;
    7)
        echo ""
        echo "=== 登录相关日志 ==="
        ssh $SERVER "pm2 logs $APP_NAME --lines 200 --nostream | grep -i '登录\|login\|密码\|token'"
        ;;
    8)
        echo ""
        echo "=== 数据库查询日志 ==="
        ssh $SERVER "pm2 logs $APP_NAME --lines 100 --nostream | grep -i 'executing\|select\|insert\|update\|delete'"
        ;;
    *)
        echo "无效选择"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "日志查看完成"
echo "=========================================="
