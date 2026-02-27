import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import models, { sequelize } from './models';
import { authenticateToken } from './middleware/auth';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import supplierRoutes from './routes/suppliers';
import customerRoutes from './routes/customers';
import purchaseRoutes from './routes/purchases';
import saleRoutes from './routes/sales';
import inventoryRoutes from './routes/inventory';
import settlementRoutes from './routes/settlements';
import reportRoutes from './routes/reports';
import dashboardRoutes from './routes/dashboard';
import brandRoutes from './routes/brands';
import expressBillRoutes from './routes/express-bills';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  credentials: true,
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://tkvn.fun', 'http://104.223.59.170', 'https://104.223.59.170']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 信任代理（因为使用了nginx反向代理）
app.set('trust proxy', 1);

// 会话中间件
app.use(session({
  secret: 'your-secret-key', // 实际应用中应该使用环境变量
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // nginx已处理HTTPS，后端接收的是HTTP
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 // 24小时过期
  }
}));

// 路由
app.use('/api/auth', authRoutes);

// 所有业务路由都需要认证
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/suppliers', authenticateToken, supplierRoutes);
app.use('/api/customers', authenticateToken, customerRoutes);
app.use('/api/purchases', authenticateToken, purchaseRoutes);
app.use('/api/sales', authenticateToken, saleRoutes);
app.use('/api/inventory', authenticateToken, inventoryRoutes);
app.use('/api/settlements', authenticateToken, settlementRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/brands', authenticateToken, brandRoutes);
app.use('/api/express-bills', authenticateToken, expressBillRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 静态文件服务
app.use(express.static('public'));

// 前端路由 fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  
  // 同步数据库模型
  // 注意：生产环境不应该使用 alter: true，这可能导致数据丢失
  // 生产环境应该使用数据库迁移工具
  try {
    // 只检查连接，不修改表结构
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 手动创建快递单相关的表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ExpressBills (
        id UUID PRIMARY KEY,
        express_code VARCHAR(255) NOT NULL UNIQUE,
        supplier_id UUID,
        status VARCHAR(50) NOT NULL DEFAULT '待处理',
        operator VARCHAR(100) NOT NULL,
        remark TEXT,
        purchase_id UUID,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      );
    `);
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ExpressBillItems (
        id UUID PRIMARY KEY,
        express_bill_id UUID NOT NULL,
        product_id UUID NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2),
        subtotal DECIMAL(10,2),
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        FOREIGN KEY (express_bill_id) REFERENCES ExpressBills(id)
      );
    `);
    
    // 为Purchase表添加express_bill_code字段
    try {
      await sequelize.query(`
        ALTER TABLE Purchases ADD COLUMN express_bill_code VARCHAR(255);
      `);
      console.log('Purchase表已添加express_bill_code字段');
    } catch (error) {
      // 忽略列已存在的错误
      console.log('Purchase表express_bill_code字段已存在');
    }
    
    console.log('快递单相关表创建完成');
    
    // 为Settlement表添加express_bill_code字段
    try {
      await sequelize.query(`
        ALTER TABLE Settlements ADD COLUMN express_bill_code VARCHAR(255);
      `);
      console.log('Settlement表已添加express_bill_code字段');
    } catch (error) {
      // 忽略列已存在的错误
      console.log('Settlement表express_bill_code字段已存在');
    }
    
    // 检查并创建默认admin用户
    const { User } = models;
    try {
      const adminUser = await User.findOne({ where: { username: 'admin' } });
      if (!adminUser) {
        console.log('创建默认admin用户...');
        await User.create({
          username: 'admin',
          password: 'admin123',
          name: '系统管理员',
          role: 'admin'
        });
        console.log('默认admin用户创建成功，用户名: admin, 密码: admin123');
      } else {
        console.log('admin用户已存在');
      }
    } catch (error) {
      console.error('创建admin用户失败:', error);
    }
  } catch (error) {
    console.error('数据库操作失败:', error);
  }
});

export default app;