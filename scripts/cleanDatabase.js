const { sequelize } = require('../config/database');

async function cleanDatabase() {
  try {
    console.log('开始清理数据库索引...');

    // 连接数据库
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 删除 generation_histories 表（如果存在）
    await sequelize.query('DROP TABLE IF EXISTS `generation_histories`');
    console.log('已删除 generation_histories 表');

    // 重新同步所有模型
    await sequelize.sync({ force: false, alter: true });
    console.log('数据库同步完成');

    process.exit(0);
  } catch (error) {
    console.error('清理数据库失败:', error);
    process.exit(1);
  }
}

cleanDatabase();