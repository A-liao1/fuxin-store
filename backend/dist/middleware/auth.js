"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = 'your-secret-key';
// JWT验证中间件
const authenticateToken = (req, res, next) => {
    try {
        // 从请求头获取token
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '未提供认证令牌'
            });
        }
        // 验证token
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role
        };
        next();
    }
    catch (error) {
        console.error('Token验证失败:', error);
        return res.status(401).json({
            success: false,
            message: '认证令牌无效或已过期'
        });
    }
};
exports.authenticateToken = authenticateToken;
