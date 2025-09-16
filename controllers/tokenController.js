const { User, TokenTransaction, sequelize } = require('../models');

const DEFAULT_REGISTER_TOKENS = 100;

const TOKEN_COSTS = {
  IMAGE_GENERATION: 10,
  VIDEO_GENERATION: 50
};

const addTokens = async (userId, type, amount, description = '', metadata = {}) => {
  const transaction = await sequelize.transaction();
  
  try {
    const user = await User.findByPk(userId, { transaction });
    
    if (!user) {
      throw new Error('用户不存在');
    }

    const newBalance = user.tokenBalance + amount;
    
    await user.update({ tokenBalance: newBalance }, { transaction });
    
    await TokenTransaction.create({
      userId,
      type,
      amount,
      balance: newBalance,
      description,
      metadata
    }, { transaction });

    await transaction.commit();
    
    return {
      success: true,
      balance: newBalance,
      transaction: {
        type,
        amount,
        description
      }
    };
  } catch (error) {
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
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        balance: user.tokenBalance,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      }
    });

  } catch (error) {
    console.error('获取token余额错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
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

    res.json({
      success: true,
      data: {
        transactions: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取token历史错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

const rechargeTokens = async (req, res) => {
  try {
    res.status(410).json({
      success: false,
      message: '此接口已废弃，请使用 /api/payment/create 创建支付订单'
    });

  } catch (error) {
    console.error('Token充值错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    });
  }
};

const checkTokenCost = async (req, res) => {
  try {
    const { type } = req.params;
    
    const cost = TOKEN_COSTS[type.toUpperCase()];
    if (cost === undefined) {
      return res.status(400).json({
        success: false,
        message: '无效的操作类型'
      });
    }

    const user = await User.findByPk(req.user.id);
    const canAfford = user.tokenBalance >= cost;

    res.json({
      success: true,
      data: {
        type: type.toUpperCase(),
        cost,
        currentBalance: user.tokenBalance,
        canAfford
      }
    });

  } catch (error) {
    console.error('检查token费用错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
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