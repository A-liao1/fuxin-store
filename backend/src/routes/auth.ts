import express from 'express';
import models from '../models';
import jwt from 'jsonwebtoken';

const router = express.Router();
const { User } = models;

// 登录尝试记录 - 存储在内存中
// 结构: { ip: { attempts: number, lockedUntil: Date | null } }
const loginAttempts = new Map<string, { attempts: number; lockedUntil: Date | null }>();

// 清理过期的锁定记录（每小时执行一次）
setInterval(() => {
  const now = new Date();
  for (const [ip, record] of loginAttempts.entries()) {
    if (record.lockedUntil && record.lockedUntil < now) {
      loginAttempts.delete(ip);
    }
  }
}, 60 * 60 * 1000);

// 获取客户端IP
const getClientIp = (req: express.Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection.remoteAddress || 'unknown';
};

// 检查IP是否被锁定
const checkLoginAttempts = (ip: string): { locked: boolean; remainingTime?: number; attempts: number } => {
  const record = loginAttempts.get(ip);
  
  if (!record) {
    return { locked: false, attempts: 0 };
  }
  
  // 检查是否被锁定
  if (record.lockedUntil) {
    const now = new Date();
    if (record.lockedUntil > now) {
      const remainingTime = Math.ceil((record.lockedUntil.getTime() - now.getTime()) / 1000 / 60);
      return { locked: true, remainingTime, attempts: record.attempts };
    } else {
      // 锁定时间已过，重置记录
      loginAttempts.delete(ip);
      return { locked: false, attempts: 0 };
    }
  }
  
  return { locked: false, attempts: record.attempts };
};

// 记录登录失败
const recordFailedLogin = (ip: string): void => {
  const record = loginAttempts.get(ip) || { attempts: 0, lockedUntil: null };
  record.attempts += 1;
  
  // 如果失败次数达到8次，锁定30分钟
  if (record.attempts >= 8) {
    const lockTime = new Date();
    lockTime.setMinutes(lockTime.getMinutes() + 30);
    record.lockedUntil = lockTime;
    console.log(`IP ${ip} 已被锁定，解锁时间: ${lockTime.toLocaleString()}`);
  }
  
  loginAttempts.set(ip, record);
};

// 清除登录记录（登录成功时）
const clearLoginAttempts = (ip: string): void => {
  loginAttempts.delete(ip);
};

// 获取所有登录尝试记录（用于调试）
router.get('/login-attempts', (req, res) => {
  const records: any[] = [];
  const now = new Date();
  
  for (const [ip, record] of loginAttempts.entries()) {
    let status = '正常';
    let remainingTime = 0;
    
    if (record.lockedUntil) {
      if (record.lockedUntil > now) {
        status = '已锁定';
        remainingTime = Math.ceil((record.lockedUntil.getTime() - now.getTime()) / 1000 / 60);
      } else {
        status = '锁定已过期';
      }
    }
    
    records.push({
      ip,
      attempts: record.attempts,
      status,
      remainingTime: remainingTime > 0 ? `${remainingTime}分钟` : '-',
      lockedUntil: record.lockedUntil ? record.lockedUntil.toLocaleString('zh-CN') : '-'
    });
  }
  
  res.json({
    success: true,
    total: records.length,
    records
  });
});

// 重置指定IP的登录尝试记录
router.post('/reset-login-attempts', (req, res) => {
  const { ip } = req.body;
  
  if (!ip) {
    return res.json({ success: false, message: '请提供IP地址' });
  }
  
  if (ip === 'all') {
    // 清除所有记录
    const count = loginAttempts.size;
    loginAttempts.clear();
    return res.json({ 
      success: true, 
      message: `已清除所有登录尝试记录，共${count}条` 
    });
  }
  
  // 清除指定IP的记录
  if (loginAttempts.has(ip)) {
    loginAttempts.delete(ip);
    return res.json({ 
      success: true, 
      message: `已重置IP ${ip} 的登录尝试记录` 
    });
  } else {
    return res.json({ 
      success: false, 
      message: `IP ${ip} 没有登录尝试记录` 
    });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    console.log('接收到登录请求:', req.body);
    
    const { username, password } = req.body;
    const clientIp = getClientIp(req);
    
    console.log('客户端IP:', clientIp);
    
    // 检查登录尝试次数
    const attemptCheck = checkLoginAttempts(clientIp);
    
    if (attemptCheck.locked) {
      console.log(`IP ${clientIp} 已被锁定，剩余时间: ${attemptCheck.remainingTime}分钟`);
      return res.json({ 
        success: false, 
        message: `登录失败次数过多，请在${attemptCheck.remainingTime}分钟后重试` 
      });
    }
    
    console.log(`IP ${clientIp} 当前登录失败次数: ${attemptCheck.attempts}`);
    
    // 查找用户
    console.log('开始查找用户:', username);
    const user = await User.findOne({ where: { username } });
    console.log('查找结果:', user ? '用户存在' : '用户不存在');
    
    if (!user) {
      console.error('用户不存在:', username);
      recordFailedLogin(clientIp);
      const newAttemptCheck = checkLoginAttempts(clientIp);
      const remainingAttempts = 8 - newAttemptCheck.attempts;
      
      if (remainingAttempts > 0) {
        return res.json({ 
          success: false, 
          message: `用户名或密码错误，还剩${remainingAttempts}次尝试机会` 
        });
      } else {
        return res.json({ 
          success: false, 
          message: '登录失败次数过多，账号已被锁定30分钟' 
        });
      }
    }
    
    // 验证密码
    console.log('开始验证密码:', username);
    const isPasswordValid = await user.comparePassword(password);
    console.log('密码验证结果:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.error('密码错误:', username);
      recordFailedLogin(clientIp);
      const newAttemptCheck = checkLoginAttempts(clientIp);
      const remainingAttempts = 8 - newAttemptCheck.attempts;
      
      if (remainingAttempts > 0) {
        return res.json({ 
          success: false, 
          message: `用户名或密码错误，还剩${remainingAttempts}次尝试机会` 
        });
      } else {
        return res.json({ 
          success: false, 
          message: '登录失败次数过多，账号已被锁定30分钟' 
        });
      }
    }
    
    // 登录成功，清除失败记录
    clearLoginAttempts(clientIp);
    
    // 生成JWT令牌
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('登录成功:', username);
    console.log('生成的token:', token);
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.json({ success: false, message: '登录失败，请稍后重试' });
  }
});

// 退出登录
router.post('/logout', (req, res) => {
  // 清除会话
  req.session.destroy((error) => {
    if (error) {
      console.error('退出登录失败:', error);
      return res.json({ success: false, message: '退出登录失败' });
    }
    res.json({ success: true, message: '退出登录成功' });
  });
});

// 检查登录状态
router.get('/status', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.json({ success: false, message: '未登录' });
    }
    
    // 验证令牌
    const decoded = jwt.verify(token, 'your-secret-key');
    res.json({ success: true, user: decoded });
  } catch (error) {
    res.json({ success: false, message: '登录已过期' });
  }
});

// 修改密码
router.post('/update-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.json({ success: false, message: '未登录' });
    }
    
    // 验证令牌
    const decoded = jwt.verify(token, 'your-secret-key') as any;
    
    const { currentPassword, newPassword } = req.body;
    
    // 查找用户
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.json({ success: false, message: '用户不存在' });
    }
    
    // 验证原密码
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.json({ success: false, message: '原密码错误' });
    }
    
    // 更新密码
    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.json({ success: false, message: '修改密码失败，请稍后重试' });
  }
});

export default router;