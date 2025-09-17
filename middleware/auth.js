const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendBusinessError, sendSystemError, BUSINESS_CODES } = require('../utils/response');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return sendBusinessError(res, BUSINESS_CODES.AUTH_TOKEN_MISSING, '访问被拒绝，请提供有效的token');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return sendBusinessError(res, BUSINESS_CODES.AUTH_USER_NOT_FOUND, '无效的token，用户不存在');
    }

    if (!user.isActive) {
      return sendBusinessError(res, BUSINESS_CODES.AUTH_USER_DISABLED);
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('认证错误:', error);

    if (error.name === 'JsonWebTokenError') {
      return sendBusinessError(res, BUSINESS_CODES.AUTH_TOKEN_INVALID);
    }

    if (error.name === 'TokenExpiredError') {
      return sendBusinessError(res, BUSINESS_CODES.AUTH_TOKEN_EXPIRED);
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