"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const path_1 = __importDefault(require("path"));
const models_1 = __importStar(require("./models"));
const auth_1 = require("./middleware/auth");
const auth_2 = __importDefault(require("./routes/auth"));
const products_1 = __importDefault(require("./routes/products"));
const suppliers_1 = __importDefault(require("./routes/suppliers"));
const customers_1 = __importDefault(require("./routes/customers"));
const purchases_1 = __importDefault(require("./routes/purchases"));
const sales_1 = __importDefault(require("./routes/sales"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const settlements_1 = __importDefault(require("./routes/settlements"));
const reports_1 = __importDefault(require("./routes/reports"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const brands_1 = __importDefault(require("./routes/brands"));
const express_bills_1 = __importDefault(require("./routes/express-bills"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// 中间件
app.use((0, cors_1.default)({
    credentials: true,
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://tkvn.fun', 'http://104.223.59.170', 'https://104.223.59.170']
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// 信任代理（因为使用了nginx反向代理）
app.set('trust proxy', 1);
// 会话中间件
app.use((0, express_session_1.default)({
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
app.use('/api/auth', auth_2.default);
// 所有业务路由都需要认证
app.use('/api/products', auth_1.authenticateToken, products_1.default);
app.use('/api/suppliers', auth_1.authenticateToken, suppliers_1.default);
app.use('/api/customers', auth_1.authenticateToken, customers_1.default);
app.use('/api/purchases', auth_1.authenticateToken, purchases_1.default);
app.use('/api/sales', auth_1.authenticateToken, sales_1.default);
app.use('/api/inventory', auth_1.authenticateToken, inventory_1.default);
app.use('/api/settlements', auth_1.authenticateToken, settlements_1.default);
app.use('/api/reports', auth_1.authenticateToken, reports_1.default);
app.use('/api/dashboard', auth_1.authenticateToken, dashboard_1.default);
app.use('/api/brands', auth_1.authenticateToken, brands_1.default);
app.use('/api/express-bills', auth_1.authenticateToken, express_bills_1.default);
// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 静态文件服务
app.use(express_1.default.static('public'));
// 前端路由 fallback
app.use((req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public', 'index.html'));
});
// 启动服务器
app.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    // 同步数据库模型
    // 注意：生产环境不应该使用 alter: true，这可能导致数据丢失
    // 生产环境应该使用数据库迁移工具
    try {
        // 只检查连接，不修改表结构
        yield models_1.sequelize.authenticate();
        console.log('数据库连接成功');
        // 手动创建快递单相关的表
        yield models_1.sequelize.query(`
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
        yield models_1.sequelize.query(`
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
            yield models_1.sequelize.query(`
        ALTER TABLE Purchases ADD COLUMN express_bill_code VARCHAR(255);
      `);
            console.log('Purchase表已添加express_bill_code字段');
        }
        catch (error) {
            // 忽略列已存在的错误
            console.log('Purchase表express_bill_code字段已存在');
        }
        console.log('快递单相关表创建完成');
        // 为Settlement表添加express_bill_code字段
        try {
            yield models_1.sequelize.query(`
        ALTER TABLE Settlements ADD COLUMN express_bill_code VARCHAR(255);
      `);
            console.log('Settlement表已添加express_bill_code字段');
        }
        catch (error) {
            // 忽略列已存在的错误
            console.log('Settlement表express_bill_code字段已存在');
        }
        // 检查并创建默认admin用户
        const { User } = models_1.default;
        try {
            const adminUser = yield User.findOne({ where: { username: 'admin' } });
            if (!adminUser) {
                console.log('创建默认admin用户...');
                yield User.create({
                    username: 'admin',
                    password: 'admin123',
                    name: '系统管理员',
                    role: 'admin'
                });
                console.log('默认admin用户创建成功，用户名: admin, 密码: admin123');
            }
            else {
                console.log('admin用户已存在');
            }
        }
        catch (error) {
            console.error('创建admin用户失败:', error);
        }
    }
    catch (error) {
        console.error('数据库操作失败:', error);
    }
}));
exports.default = app;
