const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendBusinessError, sendSystemError } = require('../utils/response');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return sendBusinessError(res, 0, '访问被拒绝，请提供有效的token');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return sendBusinessError(res, 0, '无效的token，用户不存在');
    }

    if (!user.isActive) {
      return sendBusinessError(res, 0, '账户已被禁用');
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('认证错误:', error);

    if (error.name === 'JsonWebTokenError') {
      return sendBusinessError(res, 0, '无效的token');
    }

    if (error.name === 'TokenExpiredError') {
      return sendBusinessError(res, 0, 'token已过期');
    }

    return sendSystemError(res, '认证失败');
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (user && user.isActive) {
      req.user = user;
    } else {
      req.user = null;
    }

    next();

  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};