#!/bin/bash

# 日志分析工具

LOG_FILE="logs/fuxin-out-20260226.log"

if [ ! -f "$LOG_FILE" ]; then
    echo "错误: 日志文件不存在: $LOG_FILE"
    exit 1
fi

echo "=========================================="
echo "日志分析工具"
echo "=========================================="
echo ""
echo "日志文件: $LOG_FILE"
echo "总行数: $(wc -l < $LOG_FILE)"
echo "文件大小: $(ls -lh $LOG_FILE | awk '{print $5}')"
echo ""
echo "选择分析类型："
echo "1. 登录相关日志"
echo "2. 错误日志"
echo "3. API请求统计"
echo "4. 数据库操作统计"
echo "5. 按时间段查看日志"
echo "6. 搜索关键词"
echo "7. 查看最近N行"
echo "8. 完整统计报告"
echo ""
read -p "请选择 (1-8): " choice

case $choice in
    1)
        echo ""
        echo "=== 登录相关日志 ==="
        grep -i "登录\|login\|密码\|password\|token\|auth" "$LOG_FILE" | tail -50
        echo ""
        echo "登录相关日志总数: $(grep -ic "登录\|login\|密码\|password\|token\|auth" "$LOG_FILE")"
        ;;
    2)
        echo ""
        echo "=== 错误日志 ==="
        grep -i "error\|错误\|exception\|failed\|失败" "$LOG_FILE" | tail -50
        echo ""
        echo "错误日志总数: $(grep -ic "error\|错误\|exception\|failed\|失败" "$LOG_FILE")"
        ;;
    3)
        echo ""
        echo "=== API请求统计 ==="
        echo "GET 请求: $(grep -c "GET /" "$LOG_FILE")"
        echo "POST 请求: $(grep -c "POST /" "$LOG_FILE")"
        echo "PUT 请求: $(grep -c "PUT /" "$LOG_FILE")"
        echo "DELETE 请求: $(grep -c "DELETE /" "$LOG_FILE")"
        echo ""
        echo "最常访问的API端点 (Top 10):"
        grep -oE "(GET|POST|PUT|DELETE) /[^ ]+" "$LOG_FILE" | sort | uniq -c | sort -rn | head -10
        ;;
    4)
        echo ""
        echo "=== 数据库操作统计 ==="
        echo "SELECT 查询: $(grep -c "SELECT" "$LOG_FILE")"
        echo "INSERT 操作: $(grep -c "INSERT" "$LOG_FILE")"
        echo "UPDATE 操作: $(grep -c "UPDATE" "$LOG_FILE")"
        echo "DELETE 操作: $(grep -c "DELETE" "$LOG_FILE")"
        echo ""
        echo "最常查询的表 (Top 10):"
        grep -oE "FROM \`[^\`]+\`" "$LOG_FILE" | sort | uniq -c | sort -rn | head -10
        ;;
    5)
        echo ""
        read -p "输入开始时间 (格式: 2026-02-22T12:00): " start_time
        read -p "输入结束时间 (格式: 2026-02-22T13:00): " end_time
        echo ""
        echo "=== 时间段日志 ($start_time 到 $end_time) ==="
        awk -v start="$start_time" -v end="$end_time" '$0 >= start && $0 <= end' "$LOG_FILE"
        ;;
    6)
        echo ""
        read -p "输入搜索关键词: " keyword
        echo ""
        echo "=== 搜索结果: $keyword ==="
        grep -i "$keyword" "$LOG_FILE" | tail -100
        echo ""
        echo "匹配行数: $(grep -ic "$keyword" "$LOG_FILE")"
        ;;
    7)
        echo ""
        read -p "输入行数 (默认100): " lines
        lines=${lines:-100}
        echo ""
        echo "=== 最近 $lines 行日志 ==="
        tail -n "$lines" "$LOG_FILE"
        ;;
    8)
        echo ""
        echo "=== 完整统计报告 ==="
        echo ""
        echo "📊 基本信息"
        echo "----------------------------------------"
        echo "总行数: $(wc -l < $LOG_FILE)"
        echo "文件大小: $(ls -lh $LOG_FILE | awk '{print $5}')"
        echo "日志时间范围: $(head -1 $LOG_FILE | cut -d: -f1-3) 到 $(tail -1 $LOG_FILE | cut -d: -f1-3)"
        echo ""
        
        echo "🔐 登录统计"
        echo "----------------------------------------"
        echo "登录相关日志: $(grep -ic "登录\|login" "$LOG_FILE")"
        echo "Token相关: $(grep -ic "token" "$LOG_FILE")"
        echo "认证相关: $(grep -ic "auth" "$LOG_FILE")"
        echo ""
        
        echo "❌ 错误统计"
        echo "----------------------------------------"
        echo "错误日志总数: $(grep -ic "error\|错误\|exception" "$LOG_FILE")"
        echo "失败操作: $(grep -ic "failed\|失败" "$LOG_FILE")"
        echo ""
        
        echo "🌐 API请求统计"
        echo "----------------------------------------"
        echo "GET: $(grep -c "GET /" "$LOG_FILE")"
        echo "POST: $(grep -c "POST /" "$LOG_FILE")"
        echo "PUT: $(grep -c "PUT /" "$LOG_FILE")"
        echo "DELETE: $(grep -c "DELETE /" "$LOG_FILE")"
        echo ""
        
        echo "💾 数据库操作统计"
        echo "----------------------------------------"
        echo "SELECT: $(grep -c "SELECT" "$LOG_FILE")"
        echo "INSERT: $(grep -c "INSERT" "$LOG_FILE")"
        echo "UPDATE: $(grep -c "UPDATE" "$LOG_FILE")"
        echo "DELETE: $(grep -c "DELETE" "$LOG_FILE")"
        echo ""
        
        echo "🔥 热门API端点 (Top 10)"
        echo "----------------------------------------"
        grep -oE "(GET|POST|PUT|DELETE) /[^ ]+" "$LOG_FILE" | sort | uniq -c | sort -rn | head -10
        echo ""
        
        echo "📋 热门数据表 (Top 10)"
        echo "----------------------------------------"
        grep -oE "FROM \`[^\`]+\`" "$LOG_FILE" | sort | uniq -c | sort -rn | head -10
        echo ""
        ;;
    *)
        echo "无效选择"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "分析完成"
echo "=========================================="
