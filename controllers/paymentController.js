const {
  createPaymentOrder,
  queryPaymentOrder,
  refundPaymentOrder,
  handlePaymentNotification,
  getClientIp
} = require('../services/paymentService');
const { PaymentOrder, sequelize } = require('../models');
const { sendSuccess, sendBusinessError, sendSystemError } = require('../utils/response');

const TOKEN_PACKAGES = {
  'package_100': { tokens: 100, price: 2.00, name: '100 Tokens' },
  'package_500': { tokens: 500, price: 9.00, name: '500 Tokens' },
  'package_1000': { tokens: 1000, price: 16.00, name: '1000 Tokens' },
  'package_2000': { tokens: 2000, price: 30.00, name: '2000 Tokens' },
  'package_5000': { tokens: 5000, price: 70.00, name: '5000 Tokens' }
};

const createPayment = async (req, res) => {
  try {
    const { package: packageType, paymentType, returnUrl } = req.body;
    const userId = req.user.id;

    if (!TOKEN_PACKAGES[packageType]) {
      return sendBusinessError(res, 0, '无效的套餐类型');
    }

    if (!['alipay', 'wxpay'].includes(paymentType)) {
      return sendBusinessError(res, 0, '不支持的支付方式');
    }

    const packageInfo = TOKEN_PACKAGES[packageType];
    const clientIp = getClientIp(req);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const notifyUrl = `${baseUrl}/api/payment/notify`;
    const defaultReturnUrl = `${baseUrl}/payment/result`;

    const orderData = {
      userId,
      name: packageInfo.name,
      money: packageInfo.price,
      type: paymentType,
      tokenAmount: packageInfo.tokens,
      clientIp,
      notifyUrl,
      returnUrl: returnUrl || defaultReturnUrl,
      param: packageType
    };

    const result = await createPaymentOrder(orderData);

    return sendSuccess(res, result.data, '订单创建成功');

  } catch (error) {
    console.error('创建支付订单错误:', error);

    if (error.message === '支付服务配置不完整，请联系管理员') {
      return sendBusinessError(res, 0, error.message);
    }

    return sendSystemError(res, error.message || '创建支付订单失败');
  }
};

const queryOrder = async (req, res) => {
  try {
    const { orderId, outTradeNo } = req.query;
    const userId = req.user.id;

    let order;
    if (orderId) {
      order = await PaymentOrder.findOne({
        where: { id: orderId, userId }
      });
    } else if (outTradeNo) {
      order = await PaymentOrder.findOne({
        where: { outTradeNo, userId }
      });
    }

    if (!order) {
      return sendBusinessError(res, 0, '订单不存在');
    }

    const remoteResult = await queryPaymentOrder(order.outTradeNo);

    if (remoteResult.success && (remoteResult.data.status === 1 || remoteResult.data.status === "1") && order.status === 0) {
      console.log('检测到订单支付成功，开始处理Token充值...');
      console.log('订单信息:', {
        id: order.id,
        userId: order.userId,
        tokenAmount: order.tokenAmount,
        outTradeNo: order.outTradeNo
      });

      // 更新订单状态
      await order.update({
        status: 1,
        tradeNo: remoteResult.data.trade_no || remoteResult.data.tradeNo || '',
        buyer: remoteResult.data.buyer || '',
        paidAt: new Date()
      });

      // 自动触发Token充值
      try {
        const { addTokens } = require('./tokenController');

        console.log('开始充值Token...');
        const tokenResult = await addTokens(
          order.userId,
          'PAYMENT',
          order.tokenAmount,
          `支付充值 - 订单号: ${order.outTradeNo}`,
          {
            paymentOrderId: order.id,
            tradeNo: remoteResult.data.trade_no || remoteResult.data.tradeNo,
            paymentType: order.type,
            autoCharged: true // 标记为自动充值
          }
        );

        console.log('Token充值成功:', tokenResult);
        console.log('用户新余额:', tokenResult.balance);

      } catch (chargeError) {
        console.error('Token充值失败:', chargeError);
        // 不影响查询结果的返回，只记录错误
      }
    }

    return sendSuccess(res, {
      localOrder: {
        id: order.id,
        outTradeNo: order.outTradeNo,
        tradeNo: order.tradeNo,
        name: order.name,
        money: order.money,
        type: order.type,
        status: order.status,
        tokenAmount: order.tokenAmount,
        createdAt: order.createdAt,
        paidAt: order.paidAt
      },
      remoteOrder: remoteResult.data
    });

  } catch (error) {
    console.error('查询订单错误:', error);

    if (error.message === '支付服务配置不完整，请联系管理员') {
      return sendBusinessError(res, 0, error.message);
    }

    return sendSystemError(res, error.message || '查询订单失败');
  }
};

const getOrderList = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * limit;

    const whereCondition = { userId };
    if (status !== undefined) {
      whereCondition.status = status;
    }

    const { count, rows } = await PaymentOrder.findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return sendSuccess(res, {
      orders: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('获取订单列表错误:', error);
    return sendSystemError(res, '获取订单列表失败');
  }
};

const requestRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await PaymentOrder.findOne({
      where: { id: orderId, userId }
    });

    if (!order) {
      return sendBusinessError(res, 0, '订单不存在');
    }

    if (order.status !== 1) {
      return sendBusinessError(res, 0, '只能退款已支付的订单');
    }

    if (order.status === 2) {
      return sendBusinessError(res, 0, '订单已退款');
    }

    const result = await refundPaymentOrder(order.outTradeNo, order.money);

    return sendSuccess(res, {
      orderId: order.id,
      refundAmount: order.money
    }, result.message);

  } catch (error) {
    console.error('申请退款错误:', error);
    return sendSystemError(res, error.message || '申请退款失败');
  }
};

const paymentNotify = async (req, res) => {
  try {
    console.log('收到支付通知:', req.body);

    const result = await handlePaymentNotification(req.body);

    console.log('支付通知处理结果:', result);

    res.send('success');

  } catch (error) {
    console.error('处理支付通知错误:', error);
    res.status(500).send('error');
  }
};

const getPaymentPackages = async (req, res) => {
  try {
    const packages = Object.keys(TOKEN_PACKAGES).map(key => ({
      id: key,
      ...TOKEN_PACKAGES[key]
    }));

    return sendSuccess(res, {
      packages,
      paymentTypes: [
        { id: 'alipay', name: '支付宝', icon: 'alipay' },
        { id: 'wxpay', name: '微信支付', icon: 'wechat' }
      ]
    });

  } catch (error) {
    console.error('获取支付套餐错误:', error);
    return sendSystemError(res, '获取支付套餐失败');
  }
};

// 临时测试接口：手动触发支付成功
const testPaymentSuccess = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    console.log('测试支付成功 - 订单ID:', orderId, '用户ID:', userId);

    const order = await PaymentOrder.findOne({
      where: { id: orderId, userId }
    });

    if (!order) {
      return sendBusinessError(res, 0, '订单不存在');
    }

    if (order.status === 1) {
      return sendSuccess(res, { message: '订单已经处理过了' });
    }

    // 直接调用充值逻辑，跳过签名验证
    const { addTokens } = require('./tokenController');

    console.log('开始执行Token充值...');

    try {
      // 先更新订单状态
      await order.update({
        status: 1,
        tradeNo: `test_${Date.now()}`,
        buyer: 'test@example.com',
        paidAt: new Date()
      });

      console.log('订单状态已更新，开始充值Token...');

      // 充值Token（addTokens内部有自己的事务）
      const tokenResult = await addTokens(
        userId,
        'PAYMENT',
        order.tokenAmount,
        `测试支付充值 - 订单号: ${order.outTradeNo}`,
        {
          paymentOrderId: order.id,
          testPayment: true
        }
      );

      console.log('Token充值结果:', tokenResult);

      const result = {
        success: true,
        message: '测试支付处理成功',
        data: {
          orderId: order.id,
          tokenAmount: order.tokenAmount,
          newBalance: tokenResult.balance
        }
      };

      console.log('测试充值成功:', result);

      return sendSuccess(res, result, '测试支付处理成功');

    } catch (error) {
      console.error('测试支付成功错误:', error);
      return sendSystemError(res, error.message || '测试支付处理失败');
    }
  } catch (error) {
    console.error('测试支付外层错误:', error);
    return sendSystemError(res, error.message || '测试支付处理失败');
  }
};

module.exports = {
  createPayment,
  queryOrder,
  getOrderList,
  requestRefund,
  paymentNotify,
  getPaymentPackages,
  testPaymentSuccess
};