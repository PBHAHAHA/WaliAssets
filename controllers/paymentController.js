const {
  createPaymentOrder,
  queryPaymentOrder,
  refundPaymentOrder,
  handlePaymentNotification,
  getClientIp
} = require('../services/paymentService');
const { PaymentOrder } = require('../models');
const { ZPAY_CONFIG } = require('../config/payment');

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
      return res.status(400).json({
        success: false,
        message: '无效的套餐类型'
      });
    }

    if (!['alipay', 'wxpay'].includes(paymentType)) {
      return res.status(400).json({
        success: false,
        message: '不支持的支付方式'
      });
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

    res.json({
      success: true,
      message: '订单创建成功',
      data: result.data
    });

  } catch (error) {
    console.error('创建支付订单错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '创建支付订单失败'
    });
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
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    const remoteResult = await queryPaymentOrder(order.outTradeNo);

    if (remoteResult.success && remoteResult.data.status === 1 && order.status === 0) {
      await order.update({
        status: 1,
        paidAt: new Date()
      });
    }

    res.json({
      success: true,
      data: {
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
      }
    });

  } catch (error) {
    console.error('查询订单错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '查询订单失败'
    });
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

    res.json({
      success: true,
      data: {
        orders: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败'
    });
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
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    if (order.status !== 1) {
      return res.status(400).json({
        success: false,
        message: '只能退款已支付的订单'
      });
    }

    if (order.status === 2) {
      return res.status(400).json({
        success: false,
        message: '订单已退款'
      });
    }

    const result = await refundPaymentOrder(order.outTradeNo, order.money);

    res.json({
      success: true,
      message: result.message,
      data: {
        orderId: order.id,
        refundAmount: order.money
      }
    });

  } catch (error) {
    console.error('申请退款错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '申请退款失败'
    });
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

    res.json({
      success: true,
      data: {
        packages,
        paymentTypes: [
          { id: 'alipay', name: '支付宝', icon: 'alipay' },
          { id: 'wxpay', name: '微信支付', icon: 'wechat' }
        ]
      }
    });

  } catch (error) {
    console.error('获取支付套餐错误:', error);
    res.status(500).json({
      success: false,
      message: '获取支付套餐失败'
    });
  }
};

module.exports = {
  createPayment,
  queryOrder,
  getOrderList,
  requestRefund,
  paymentNotify,
  getPaymentPackages
};