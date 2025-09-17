const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmailVerification = sequelize.define('EmailVerification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  code: {
    type: DataTypes.STRING(6),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('register', 'login', 'reset_password'),
    allowNull: false,
    defaultValue: 'register'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'email_verifications',
  timestamps: true,
  indexes: [
    {
      fields: ['email', 'code']
    },
    {
      fields: ['expiresAt']
    }
  ]
});

// 验证验证码
EmailVerification.prototype.isValid = function() {
  return !this.used && new Date() < this.expiresAt && this.attempts < 3;
};

// 标记为已使用
EmailVerification.prototype.markAsUsed = async function() {
  this.used = true;
  await this.save();
};

// 增加尝试次数
EmailVerification.prototype.incrementAttempts = async function() {
  this.attempts += 1;
  await this.save();
};

module.exports = EmailVerification;