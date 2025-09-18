const { User, TokenTransaction, sequelize } = require('../models');
const { sendSuccess, sendBusinessError, sendSystemError } = require('../utils/response');

const DEFAULT_REGISTER_TOKENS = 100;

const TOKEN_COSTS = {
  IMAGE_GENERATION: 20,
  VIDEO_GENERATION: 100
};

const addTokens = async (userId, type, amount, description = '', metadata = {}) => {
  console.log('===== addTokens 开始 =====');
  console.log('参数:', { userId, type, amount, description, metadata });

  const transaction = await sequelize.transaction();

  try {
    console.log('查找用户:', userId);
    const user = await User.findByPk(userId, { transaction });

    if (!user) {
      console.error('用户不存在:', userId);
      throw new Error('用户不存在');
    }

    console.log('用户当前余额:', user.tokenBalance);
    const newBalance = user.tokenBalance + amount;
    console.log('计算新余额:', newBalance);

    console.log('更新用户余额...');
    await user.update({ tokenBalance: newBalance }, { transaction });

    console.log('创建Token交易记录...');
    await TokenTransaction.create({
      userId,
      type,
      amount,
      balance: newBalance,
      description,
      metadata
    }, { transaction });

    console.log('提交事务...');
    await transaction.commit();

    const result = {
      success: true,
      balance: newBalance,
      transaction: {
        type,
        amount,
        description
      }
    };

    console.log('===== addTokens 成功完成 =====');
    console.log('返回结果:', result);
    return result;

  } catch (error) {
    console.error('===== addTokens 发生错误 =====');
    console.error('错误详情:', error);
    await transaction.rollback();
    throw error;
  }
};

const consumeTokens = async (userId, type, amount, description = '', metadata = {}) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findByPk(userId, { transaction });

    if (!user) {
      throw new Error('用户不存在');
    }

    if (user.tokenBalance < amount) {
      throw new Error(`Token余额不足，当前余额: ${user.tokenBalance}, 需要: ${amount}`);
    }

    const newBalance = user.tokenBalance - amount;

    await user.update({ tokenBalance: newBalance }, { transaction });

    await TokenTransaction.create({
      userId,
      type,
      amount: -amount,
      balance: newBalance,
      description,
      metadata
    }, { transaction });

    await transaction.commit();

    return {
      success: true,
      balance: newBalance,
      consumed: amount,
      transaction: {
        type,
        amount: -amount,
        description
      }
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getTokenBalance = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'tokenBalance']
    });

    if (!user) {
      return sendBusinessError(res, 0, '用户不存在');
    }

    return sendSuccess(res, {
      balance: user.tokenBalance,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('获取token余额错误:', error);
    return sendSystemError(res, '获取token余额失败');
  }
};

const getTokenHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await TokenTransaction.findAndCountAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return sendSuccess(res, {
      transactions: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('获取token历史错误:', error);
    return sendSystemError(res, '获取token历史失败');
  }
};

const rechargeTokens = async (req, res) => {
  return sendBusinessError(res, 0, '此接口已废弃，请使用 /api/payment/create 创建支付订单');
};

const checkTokenCost = async (req, res) => {
  try {
    const { type } = req.params;

    const cost = TOKEN_COSTS[type.toUpperCase()];
    if (cost === undefined) {
      return sendBusinessError(res, 0, '无效的操作类型');
    }

    const user = await User.findByPk(req.user.id);
    const canAfford = user.tokenBalance >= cost;

    return sendSuccess(res, {
      type: type.toUpperCase(),
      cost,
      currentBalance: user.tokenBalance,
      canAfford
    });

  } catch (error) {
    console.error('检查token费用错误:', error);
    return sendSystemError(res, '检查token费用失败');
  }
};

module.exports = {
  addTokens,
  consumeTokens,
  getTokenBalance,
  getTokenHistory,
  rechargeTokens,
  checkTokenCost,
  DEFAULT_REGISTER_TOKENS,
  TOKEN_COSTS
};