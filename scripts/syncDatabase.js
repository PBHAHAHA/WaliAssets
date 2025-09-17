const { sequelize } = require('../config/database');
const db = require('../models');

const syncDatabase = async () => {
  try {
    console.log('开始同步数据库...');

    // 同步所有模型
    await sequelize.sync({ alter: true });

    console.log('数据库同步成功！');

    // 显示创建的表
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('数据库表:', tables);

  } catch (error) {
    console.error('数据库同步失败:', error);
  } finally {
    await sequelize.close();
  }
};

syncDatabase();