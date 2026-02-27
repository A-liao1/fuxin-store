import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your-secret-key';

// 扩展Request类型以包含user属性
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: string;
      };
    }
  }
}

// JWT验证中间件
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
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
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Token验证失败:', error);
    return res.status(401).json({ 
      success: false, 
      message: '认证令牌无效或已过期' 
    });
  }
};
