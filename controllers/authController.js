const jwt = require('jsonwebtoken');
const { User, EmailVerification } = require('../models');
const { addTokens, DEFAULT_REGISTER_TOKENS } = require('./tokenController');
const { sendVerificationEmail } = require('../services/emailService');
const { isEmailDomainAllowed, generateVerificationCode, getAllowedDomains } = require('../utils/emailUtils');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// 发送邮箱验证码
const sendEmailCode = async (req, res) => {
  try {
    const { email, type = 'register' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: '邮箱地址是必填项'
      });
    }

    // 验证邮箱域名
    if (!isEmailDomainAllowed(email)) {
      return res.status(400).json({
        success: false,
        message: `暂时只支持以下邮箱注册：${getAllowedDomains().join(', ')}`,
        allowedDomains: getAllowedDomains()
      });
    }

    // 检查邮箱是否已注册（仅注册时检查）
    if (type === 'register') {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '邮箱已被注册'
        });
      }
    }

    // 检查最近是否已发送验证码（防止频繁发送）
    const recentCode = await EmailVerification.findOne({
      where: {
        email,
        type,
        createdAt: {
          [require('sequelize').Op.gte]: new Date(Date.now() - 60000) // 1分钟内
        }
      }
    });

    if (recentCode) {
      return res.status(429).json({
        success: false,
        message: '验证码发送过于频繁，请1分钟后再试'
      });
    }

    // 生成验证码
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    // 保存验证码
    await EmailVerification.create({
      email,
      code,
      type,
      expiresAt
    });

    // 发送邮件
    await sendVerificationEmail(email, code, type);

    res.json({
      success: true,
      message: '验证码已发送到您的邮箱，请查收',
      data: {
        email,
        expiresIn: 600 // 10分钟
      }
    });

  } catch (error) {
    console.error('发送验证码错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '发送验证码失败'
    });
  }
};

const register = async (req, res) => {
  try {
    const { username, email, password, emailCode } = req.body;

    if (!username || !email || !password || !emailCode) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱、密码和验证码都是必填项'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少为6位'
      });
    }

    // 验证邮箱域名
    if (!isEmailDomainAllowed(email)) {
      return res.status(400).json({
        success: false,
        message: `暂时只支持以下邮箱注册：${getAllowedDomains().join(', ')}`,
        allowedDomains: getAllowedDomains()
      });
    }

    // 验证邮箱验证码
    const verification = await EmailVerification.findOne({
      where: {
        email,
        code: emailCode,
        type: 'register',
        used: false
      },
      order: [['createdAt', 'DESC']]
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: '验证码无效'
      });
    }

    if (!verification.isValid()) {
      return res.status(400).json({
        success: false,
        message: '验证码已过期或已使用'
      });
    }

    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名或邮箱已存在'
      });
    }

    // 标记验证码为已使用
    await verification.markAsUsed();

    const user = await User.create({
      username,
      email,
      password,
      tokenBalance: 0
    });

    await addTokens(
      user.id,
      'REGISTER_BONUS',
      DEFAULT_REGISTER_TOKENS,
      '新用户注册奖励',
      { registrationDate: new Date() }
    );

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: `用户注册成功，获得 ${DEFAULT_REGISTER_TOKENS} tokens奖励`,
      data: {
        user,
        token,
        tokenBonus: DEFAULT_REGISTER_TOKENS
      }
    });

  } catch (error) {
    console.error('注册错误:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => err.message);
      return res.status(400).json({
        success: false,
        message: '验证失败',
        errors
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: '用户名或邮箱已存在'
      });
    }

    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码都是必填项'
      });
    }

    const user = await User.findOne({
      where: { email },
      attributes: ['id', 'username', 'email', 'password', 'avatar', 'isActive', 'lastLoginAt']
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用'
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
    }

    await user.update({ lastLoginAt: new Date() });

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, avatar } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (username && username !== user.username) {
      const existingUser = await User.findOne({
        where: { username }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '用户名已存在'
        });
      }
    }

    await user.update({
      username: username || user.username,
      avatar: avatar !== undefined ? avatar : user.avatar
    });

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: { user }
    });

  } catch (error) {
    console.error('更新用户信息错误:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => err.message);
      return res.status(400).json({
        success: false,
        message: '验证失败',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  sendEmailCode,
  register,
  login,
  getProfile,
  updateProfile
};