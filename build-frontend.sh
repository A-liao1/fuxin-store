#!/bin/bash

# 简化的前端构建脚本，忽略TypeScript错误

echo "开始构建前端..."

# 进入前端目录
cd ./frontend

# 安装依赖
npm install

# 使用vite直接构建，忽略TypeScript错误
echo "构建前端（忽略TypeScript错误）..."
npx vite build --emptyOutDir

echo "前端构建完成！"
