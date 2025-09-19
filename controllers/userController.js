const { User } = require('../models');
const { sendSuccess, sendBusinessError, sendSystemError } = require('../utils/response');

// 获取所有注册用户
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, verifyCode } = req.query;

    // 校验码验证
    if (verifyCode !== 'pubing') {
      return sendBusinessError(res, 0, '校验码错误');
    }

    // 参数验证
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return sendBusinessError(res, 0, '分页参数错误，页码不能小于1，每页数量范围1-100');
    }

    const offset = (pageNum - 1) * limitNum;

    // 获取用户总数
    const totalUsers = await User.count();

    // 获取用户列表
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'tokenBalance', 'isActive', 'createdAt', 'lastLoginAt'],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: offset
    });

    // 计算总页数
    const totalPages = Math.ceil(totalUsers / limitNum);

    return sendSuccess(res, {
      users,
      pagination: {
        total: totalUsers,
        page: pageNum,
        limit: limitNum,
        totalPages: totalPages
      }
    }, `成功获取 ${users.length} 个用户信息`);

  } catch (error) {
    console.error('获取用户列表错误:', error);
    return sendSystemError(res, '获取用户列表失败');
  }
};

module.exports = {
  getAllUsers
};