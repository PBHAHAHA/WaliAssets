const { User } = require('../models');
const { TOKEN_COSTS } = require('../controllers/tokenController');

const requireTokens = (operationType) => {
  return async (req, res, next) => {
    try {
      const cost = TOKEN_COSTS[operationType];
      
      if (!cost) {
        return res.status(400).json({
          success: false,
          message: '无效的操作类型'
        });
      }

      const user = await User.findByPk(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      if (user.tokenBalance < cost) {
        return res.status(402).json({
          success: false,
          message: `Token余额不足，当前余额: ${user.tokenBalance}, 需要: ${cost}`,
          data: {
            currentBalance: user.tokenBalance,
            required: cost,
            shortfall: cost - user.tokenBalance
          }
        });
      }

      req.tokenCost = cost;
      req.operationType = operationType;
      next();

    } catch (error) {
      console.error('Token检查错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  };
};

const checkTokenBalance = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'tokenBalance']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    req.userTokenBalance = user.tokenBalance;
    next();

  } catch (error) {
    console.error('获取Token余额错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  requireTokens,
  checkTokenBalance
};