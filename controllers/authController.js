const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { addTokens, DEFAULT_REGISTER_TOKENS } = require('./tokenController');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱和密码都是必填项'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少为6位'
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

    const user = await User.create({
      username,
      email,
      password,
      tokenBalance: DEFAULT_REGISTER_TOKENS
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
  register,
  login,
  getProfile,
  updateProfile
};