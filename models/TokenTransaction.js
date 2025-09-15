const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TokenTransaction = sequelize.define('TokenTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  type: {
    type: DataTypes.ENUM('REGISTER_BONUS', 'IMAGE_GENERATION', 'VIDEO_GENERATION', 'RECHARGE', 'PAYMENT', 'ADMIN_ADJUST'),
    allowNull: false,
    comment: '交易类型：注册奖励、图片生成、视频生成、充值、支付充值、管理员调整'
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'token数量，正数为增加，负数为消耗'
  },
  balance: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '交易后的余额'
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '交易描述'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '额外的元数据信息'
  }
}, {
  tableName: 'token_transactions',
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'createdAt']
    },
    {
      fields: ['type']
    }
  ]
});

module.exports = TokenTransaction;