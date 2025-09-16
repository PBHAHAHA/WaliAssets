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
  const url = `${ZPAY_CONFIG.baseUrl}${ZPAY_CONFIG.endpoints.query}?act=order&pid=${ZPAY_CONFIG.pid}&key=${ZPAY_CONFIG.key}&out_trade_no=${outTradeNo}`;

  try {
    const response = await axios.get(url);
    const result = response.data;

    if (result.code === 1) {
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

  if (!verifySignature(notifyData, ZPAY_CONFIG.key)) {
    throw new Error('签名验证失败');
  }

  if (trade_status !== 'TRADE_SUCCESS') {
    throw new Error('支付状态异常');
  }

  const transaction = await sequelize.transaction();

  try {
    const paymentOrder = await PaymentOrder.findOne({
      where: { outTradeNo: out_trade_no },
      transaction
    });

    if (!paymentOrder) {
      await transaction.rollback();
      throw new Error('订单不存在');
    }

    if (paymentOrder.status === 1) {
      await transaction.commit();
      return { success: true, message: '订单已处理' };
    }

    if (parseFloat(paymentOrder.money) !== parseFloat(money)) {
      await transaction.rollback();
      throw new Error('订单金额不匹配');
    }

    await paymentOrder.update({
      status: 1,
      tradeNo: trade_no,
      buyer,
      paidAt: new Date()
    }, { transaction });

    await TokenTransaction.create({
      userId: paymentOrder.userId,
      type: 'PAYMENT',
      amount: paymentOrder.tokenAmount,
      balance: 0,
      description: `支付充值 - 订单号: ${out_trade_no}`,
      metadata: {
        paymentOrderId: paymentOrder.id,
        tradeNo: trade_no,
        paymentType: type
      }
    }, { transaction });

    const user = await User.findByPk(paymentOrder.userId, { transaction });
    const newBalance = user.tokenBalance + paymentOrder.tokenAmount;
    await user.update({ tokenBalance: newBalance }, { transaction });

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

    await transaction.commit();

    return {
      success: true,
      message: '支付成功',
      data: {
        orderId: paymentOrder.id,
        tokenAmount: paymentOrder.tokenAmount
      }
    };

  } catch (error) {
    await transaction.rollback();
    console.error('处理支付通知错误:', error);
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