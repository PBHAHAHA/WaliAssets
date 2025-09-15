const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问被拒绝，请提供有效的token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '无效的token，用户不存在'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('认证错误:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'token已过期'
      });
    }

    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
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