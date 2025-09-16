const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GenerationHistory = sequelize.define('GenerationHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('image', 'animation'),
    allowNull: false,
    comment: '生成类型：图像或动画'
  },
  prompt: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '生成提示词'
  },
  parameters: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '生成参数'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'pending',
    comment: '生成状态'
  },
  taskId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    comment: '任务ID'
  },
  resultUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '生成结果URL'
  },
  resultUrls: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '多个结果URL（数组格式）'
  },
  tokenConsumed: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '消耗的token数量'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '错误信息'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '额外元数据'
  },
  progress: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '进度百分比 0-100'
  }
}, {
  tableName: 'generation_histories',
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'createdAt']
    },
    {
      fields: ['taskId'],
      unique: true
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = GenerationHistory;