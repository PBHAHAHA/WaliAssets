const axios = require('axios');
const { ZPAY_CONFIG, generateOrderNo, createSignature, verifySignature } = require('../config/payment');
const { PaymentOrder, User, TokenTransaction, sequelize } = require('../models');

const getClientIp = (req) => {
  return req.headers['x-forwarded-for'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         '127.0.0.1';
};

const createPaymentOrder = async (orderData) => {
  // 检查支付配置是否完整
  if (!ZPAY_CONFIG.baseUrl || !ZPAY_CONFIG.pid || !ZPAY_CONFIG.key) {
    throw new Error('支付服务配置不完整，请联系管理员');
  }

  const {
    userId,
    name,
    money,
    type,
    tokenAmount,
    clientIp,
    notifyUrl,
    returnUrl,
    param = ''
  } = orderData;

  const outTradeNo = generateOrderNo();

  const params = {
    pid: ZPAY_CONFIG.pid,
    type,
    out_trade_no: outTradeNo,
    notify_url: notifyUrl,
    return_url: returnUrl,
    name,
    money: money.toString(),
    clientip: clientIp,
    device: 'pc',
    param,
    sign_type: 'MD5'
  };

  const sign = createSignature(params, ZPAY_CONFIG.key);
  params.sign = sign;

  try {
    const response = await axios.post(`${ZPAY_CONFIG.baseUrl}${ZPAY_CONFIG.endpoints.api}`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      transformRequest: [function (data) {
        return Object.keys(data)
          .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
          .join('&');
      }]
    });

    const result = response.data;

    if (result.code === 1) {
      const paymentOrder = await PaymentOrder.create({
        userId,
        outTradeNo,
        tradeNo: result.trade_no || result.O_id,
        name,
        money,
        type,
        tokenAmount,
        notifyUrl,
        returnUrl,
        payUrl: result.payurl,
        qrCode: result.qrcode,
        clientIp,
        param
      });

      return {
        success: true,
        data: {
          orderId: paymentOrder.id,
          outTradeNo,
          tradeNo: result.trade_no || result.O_id,
          payUrl: result.payurl,
          qrCode: result.qrcode || result.img,
          amount: money,
          tokenAmount
        }
      };
    } else {
      throw new Error(result.msg || '创建支付订单失败');
    }
  } catch (error) {
    console.error('创建支付订单错误:', error);
    throw new Error(error.response?.data?.msg || error.message || '网络请求失败');
  }
};

const queryPaymentOrder = async (outTradeNo) => {
  // 检查支付配置是否完整
  if (!ZPAY_CONFIG.baseUrl || !ZPAY_CONFIG.pid || !ZPAY_CONFIG.key) {
    throw new Error('支付服务配置不完整，请联系管理员');
  }

  const url = `${ZPAY_CONFIG.baseUrl}${ZPAY_CONFIG.endpoints.query}?act=order&pid=${ZPAY_CONFIG.pid}&key=${ZPAY_CONFIG.key}&out_trade_no=${outTradeNo}`;

  try {
    const response = await axios.get(url);
    const result = response.data;

    console.log('支付查询原始响应:', JSON.stringify(result, null, 2));

    // 根据实际API响应格式调整判断条件
    // 如果返回的msg是"查询订单号成功！"，说明查询本身是成功的
    if (result.code === 1 || (result.msg && result.msg.includes('成功'))) {
      return {
        success: true,
        data: {
          tradeNo: result.trade_no,
          outTradeNo: result.out_trade_no,
          type: result.type,
          pid: result.pid,
          addtime: result.addtime,
          endtime: result.endtime,
          name: result.name,
          money: result.money,
          status: result.status,
          param: result.param,
          buyer: result.buyer
        }
      };
    } else {
      throw new Error(result.msg || '查询订单失败');
    }
  } catch (error) {
    console.error('查询订单错误:', error);
    // 如果错误消息包含"成功"，说明查询本身是成功的，但可能订单状态有问题
    if (error.message && error.message.includes('成功')) {
      return {
        success: true,
        data: {
          status: 0, // 默认未支付状态
          message: error.message
        }
      };
    }
    throw new Error(error.response?.data?.msg || error.message || '查询失败');
  }
};

const refundPaymentOrder = async (outTradeNo, money) => {
  const params = {
    act: 'refund',
    pid: ZPAY_CONFIG.pid,
    key: ZPAY_CONFIG.key,
    out_trade_no: outTradeNo,
    money: money.toString()
  };

  try {
    const response = await axios.post(`${ZPAY_CONFIG.baseUrl}${ZPAY_CONFIG.endpoints.query}`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const result = response.data;

    if (result.code === 1) {
      await PaymentOrder.update(
        { status: 2 },
        { where: { outTradeNo } }
      );

      return {
        success: true,
        message: result.msg || '退款成功'
      };
    } else {
      throw new Error(result.msg || '退款失败');
    }
  } catch (error) {
    console.error('退款错误:', error);
    throw new Error(error.response?.data?.msg || error.message || '退款请求失败');
  }
};

const handlePaymentNotification = async (notifyData) => {
  console.log('====== 开始处理支付通知 ======');
  console.log('通知数据:', JSON.stringify(notifyData, null, 2));

  const {
    pid,
    trade_no,
    out_trade_no,
    type,
    name,
    money,
    trade_status,
    sign,
    sign_type,
    param,
    buyer
  } = notifyData;

  console.log('开始验证签名...');
  const signVerified = verifySignature(notifyData, ZPAY_CONFIG.key);
  console.log('签名验证结果:', signVerified);

  if (!signVerified) {
    console.error('签名验证失败! 收到的签名:', sign);
    throw new Error('签名验证失败');
  }

  console.log('当前支付状态:', trade_status);
  if (trade_status !== 'TRADE_SUCCESS') {
    console.error('支付状态异常，期望: TRADE_SUCCESS, 实际:', trade_status);
    throw new Error(`支付状态异常: ${trade_status}`);
  }

  const transaction = await sequelize.transaction();

  try {
    console.log('查找订单:', out_trade_no);
    const paymentOrder = await PaymentOrder.findOne({
      where: { outTradeNo: out_trade_no },
      transaction
    });

    if (!paymentOrder) {
      console.error('订单不存在:', out_trade_no);
      await transaction.rollback();
      throw new Error('订单不存在');
    }

    console.log('找到订单:', {
      id: paymentOrder.id,
      userId: paymentOrder.userId,
      status: paymentOrder.status,
      tokenAmount: paymentOrder.tokenAmount,
      money: paymentOrder.money
    });

    if (paymentOrder.status === 1) {
      console.log('订单已经处理过了');
      await transaction.commit();
      return { success: true, message: '订单已处理' };
    }

    console.log('验证订单金额:', { 订单金额: paymentOrder.money, 通知金额: money });
    if (parseFloat(paymentOrder.money) !== parseFloat(money)) {
      console.error('订单金额不匹配!', { 订单金额: paymentOrder.money, 通知金额: money });
      await transaction.rollback();
      throw new Error('订单金额不匹配');
    }

    console.log('更新订单状态为已支付...');
    await paymentOrder.update({
      status: 1,
      tradeNo: trade_no,
      buyer,
      paidAt: new Date()
    }, { transaction });

    console.log('创建Token交易记录...');
    await TokenTransaction.create({
      userId: paymentOrder.userId,
      type: 'PAYMENT',
      amount: paymentOrder.tokenAmount,
      balance: 0, // 会在后面更新
      description: `支付充值 - 订单号: ${out_trade_no}`,
      metadata: {
        paymentOrderId: paymentOrder.id,
        tradeNo: trade_no,
        paymentType: type
      }
    }, { transaction });

    console.log('查找用户并更新余额...');
    const user = await User.findByPk(paymentOrder.userId, { transaction });
    console.log('用户当前余额:', user.tokenBalance);
    const newBalance = user.tokenBalance + paymentOrder.tokenAmount;
    console.log('更新后余额:', newBalance);

    await user.update({ tokenBalance: newBalance }, { transaction });

    console.log('更新Token交易记录的余额...');
    await TokenTransaction.update(
      { balance: newBalance },
      {
        where: {
          userId: paymentOrder.userId,
          type: 'PAYMENT',
          description: `支付充值 - 订单号: ${out_trade_no}`
        },
        transaction
      }
    );

    console.log('提交事务...');
    await transaction.commit();

    console.log('====== 支付处理成功! ======');
    console.log('订单ID:', paymentOrder.id);
    console.log('用户ID:', paymentOrder.userId);
    console.log('充值Token数量:', paymentOrder.tokenAmount);
    console.log('用户新余额:', newBalance);

    return {
      success: true,
      message: '支付成功',
      data: {
        orderId: paymentOrder.id,
        tokenAmount: paymentOrder.tokenAmount,
        newBalance: newBalance
      }
    };

  } catch (error) {
    console.error('处理支付通知错误，回滚事务:', error);
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  createPaymentOrder,
  queryPaymentOrder,
  refundPaymentOrder,
  handlePaymentNotification,
  getClientIp
};