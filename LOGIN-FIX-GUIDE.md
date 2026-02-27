# 登录问题诊断和修复指南

## 问题描述
远程服务器 https://tkvn.fun 无法正常登录后台

## 可能的原因

1. **Session配置问题** - HTTPS环境下cookie配置不正确
2. **CORS配置问题** - 跨域请求被阻止
3. **后端服务未运行** - PM2进程停止或崩溃
4. **数据库问题** - 管理员账号不存在或密码错误
5. **Nginx代理配置** - 反向代理设置有误

## 已修复的问题

### 1. Session Cookie配置
- ✅ 添加了 `trust proxy` 设置（因为使用nginx反向代理）
- ✅ 修改cookie配置适应HTTPS环境
- ✅ 延长session过期时间到24小时
- ✅ 添加了 `httpOnly` 和 `sameSite` 安全设置

### 2. CORS配置
- ✅ 添加了IP地址到允许的源列表

## 诊断步骤

### 步骤1: 快速诊断（本地运行）
```bash
./diagnose-login.sh
```
这将检查：
- 服务器连接性
- HTTPS访问
- API健康状态
- 验证码接口
- 登录接口

### 步骤2: 检查服务器状态（需要SSH访问）
```bash
./check-server-status.sh
```
这将检查：
- PM2进程状态
- 服务日志
- 端口监听
- Nginx状态
- 数据库文件
- 部署目录

### 步骤3: 重置管理员密码（如果需要）
```bash
./reset-admin-remote.sh
```
这将重置管理员密码为: `admin123`

## 修复和部署

### 完整重新部署（推荐）
```bash
./fix-and-deploy.sh
```

这个脚本会：
1. 重新构建后端（包含修复）
2. 重新构建前端
3. 打包部署文件
4. 上传到服务器
5. 停止旧服务
6. 部署新版本
7. 启动服务

### 手动部署步骤

如果自动脚本失败，可以手动执行：

```bash
# 1. 构建后端
cd backend
npm run build
cd ..

# 2. 构建前端
cd frontend
npm run build
cd ..

# 3. 准备部署包
rm -rf deploy/dist deploy/public
mkdir -p deploy/dist deploy/public
cp -r backend/dist/* deploy/dist/
cp backend/package.json deploy/
cp -r frontend/dist/* deploy/public/

# 4. 打包
cd deploy
tar -czf ../deploy-fix.tar.gz .
cd ..

# 5. 上传
scp deploy-fix.tar.gz root@104.223.59.170:/tmp/

# 6. SSH到服务器
ssh root@104.223.59.170

# 7. 在服务器上执行
pm2 stop fuxin
cd /root
mv fuxin fuxin.backup.$(date +%Y%m%d_%H%M%S)
mkdir -p fuxin
cd fuxin
tar -xzf /tmp/deploy-fix.tar.gz
npm install --production
pm2 start dist/index.js --name fuxin --time
pm2 logs fuxin --lines 20
```

## 验证修复

部署完成后，测试以下内容：

1. **访问首页**
   ```
   https://tkvn.fun
   ```

2. **测试健康检查**
   ```bash
   curl https://tkvn.fun/health
   ```

3. **测试登录**
   - 用户名: `admin`
   - 密码: `admin123`
   - 验证码: 任意输入（当前已禁用验证）

## 常见问题

### Q1: 登录后立即退出
**原因**: Session cookie未正确设置
**解决**: 已在代码中修复，重新部署即可

### Q2: 验证码无法显示
**原因**: API路径配置或CORS问题
**解决**: 检查nginx配置和CORS设置

### Q3: 提示"登录失败，请检查网络连接"
**原因**: 后端服务未运行或API路径错误
**解决**: 运行 `check-server-status.sh` 检查服务状态

### Q4: 密码错误
**原因**: 数据库中的密码hash不匹配
**解决**: 运行 `reset-admin-remote.sh` 重置密码

## 监控和日志

### 查看实时日志
```bash
ssh root@104.223.59.170 'pm2 logs fuxin'
```

### 查看PM2状态
```bash
ssh root@104.223.59.170 'pm2 status'
```

### 重启服务
```bash
ssh root@104.223.59.170 'pm2 restart fuxin'
```

## 联系信息

如果问题仍未解决，请提供以下信息：
1. `diagnose-login.sh` 的输出
2. `check-server-status.sh` 的输出
3. 浏览器控制台的错误信息
4. 浏览器网络面板的请求详情
