const { sequelize } = require('../config/database');
const User = require('./User');
const TokenTransaction = require('./TokenTransaction');
const PaymentOrder = require('./PaymentOrder');
const GenerationHistory = require('./GenerationHistory');

User.hasMany(TokenTransaction, { foreignKey: 'userId', as: 'tokenTransactions' });
TokenTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(PaymentOrder, { foreignKey: 'userId', as: 'paymentOrders' });
PaymentOrder.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(GenerationHistory, { foreignKey: 'userId', as: 'generationHistories' });
GenerationHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

const db = {
  sequelize,
  User,
  TokenTransaction,
  PaymentOrder,
  GenerationHistory
};

module.exports = db;