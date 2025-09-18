const { User } = require('../models');
const { TOKEN_COSTS } = require('../controllers/tokenController');
const { sendBusinessError, sendSystemError } = require('../utils/response');

const requireTokens = (operationType) => {
  return async (req, res, next) => {
    try {
      const cost = TOKEN_COSTS[operationType];

      if (!cost) {
        return sendBusinessError(res, 0, '无效的操作类型');
      }

      const user = await User.findByPk(req.user.id);

      if (!user) {
        return sendBusinessError(res, 0, '用户不存在');
      }

      if (user.tokenBalance < cost) {
        return sendBusinessError(
          res,
          0,
          `Token余额不足，当前余额: ${user.tokenBalance}, 需要: ${cost}`,
          {
            currentBalance: user.tokenBalance,
            required: cost,
            shortfall: cost - user.tokenBalance
          }
        );
      }

      req.tokenCost = cost;
      req.operationType = operationType;
      next();

    } catch (error) {
      console.error('Token检查错误:', error);
      return sendSystemError(res, 'Token检查失败');
    }
  };
};

const checkTokenBalance = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'tokenBalance']
    });

    if (!user) {
      return sendBusinessError(res, 0);
    }

    req.userTokenBalance = user.tokenBalance;
    next();

  } catch (error) {
    console.error('获取Token余额错误:', error);
    return sendSystemError(res, '获取Token余额失败');
  }
};

module.exports = {
  requireTokens,
  checkTokenBalance
};