const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PaymentOrder = sequelize.define('PaymentOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '用户ID'
  },
  outTradeNo: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
    comment: '商户订单号'
  },
  tradeNo: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '易支付订单号'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '商品名称'
  },
  money: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '订单金额'
  },
  type: {
    type: DataTypes.ENUM('alipay', 'wxpay'),
    allowNull: false,
    comment: '支付方式'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '订单状态：0-未支付，1-已支付，2-已退款'
  },
  tokenAmount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '充值Token数量'
  },
  notifyUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '异步通知地址'
  },
  returnUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '同步跳转地址'
  },
  payUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '支付链接'
  },
  qrCode: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '二维码链接'
  },
  clientIp: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: '客户端IP'
  },
  param: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '业务扩展参数'
  },
  buyer: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '支付者账号'
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '支付完成时间'
  }
}, {
  tableName: 'payment_orders',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['outTradeNo']
    },
    {
      fields: ['tradeNo']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = PaymentOrder;