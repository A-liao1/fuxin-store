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
    
    // 手动创建缺失的表
    // 创建Inventories表（复数形式）
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Inventories (
        product_id UUID PRIMARY KEY,
        current_quantity INTEGER NOT NULL DEFAULT 0,
        avg_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        FOREIGN KEY (product_id) REFERENCES Products(id)
      );
    `);
    
    // 创建InventoryLog表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS InventoryLogs (
        id UUID PRIMARY KEY,
        product_id UUID NOT NULL,
        type VARCHAR(50) NOT NULL,
        quantity INTEGER NOT NULL,
        balance INTEGER NOT NULL,
        reference_type VARCHAR(50),
        reference_id UUID,
        operator VARCHAR(100) NOT NULL,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        FOREIGN KEY (product_id) REFERENCES Products(id)
      );
    `);
    
    console.log('数据库表创建完成');
    
    // 为每个商品创建初始库存记录
    try {
      const { Product, Inventory } = models;
      const products = await Product.findAll();
      for (const product of products) {
        const existingInventory = await Inventory.findOne({ where: { product_id: product.id } });
        if (!existingInventory) {
          await Inventory.create({
            product_id: product.id,
            current_quantity: 0,
            avg_cost: 0
          });
        }
      }
      console.log('初始库存记录创建完成');
    } catch (error) {
      console.error('创建初始库存记录失败:', error);
    }
    
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