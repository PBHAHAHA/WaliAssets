const { sequelize } = require('../config/database');

async function resetDatabase() {
  try {
    console.log('开始重置数据库...');

    // 连接数据库
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 获取所有表名
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = 'wali_db'
      AND TABLE_TYPE = 'BASE TABLE'
    `);

    console.log('找到的表:', tables.map(t => t.TABLE_NAME));

    // 禁用外键检查
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // 删除所有表
    for (const table of tables) {
      await sequelize.query(`DROP TABLE IF EXISTS \`${table.TABLE_NAME}\``);
      console.log(`已删除表: ${table.TABLE_NAME}`);
    }

    // 启用外键检查
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // 重新创建所有表
    await sequelize.sync({ force: true });
    console.log('数据库重置完成，所有表已重新创建');

    process.exit(0);
  } catch (error) {
    console.error('重置数据库失败:', error);
    process.exit(1);
  }
}

resetDatabase();