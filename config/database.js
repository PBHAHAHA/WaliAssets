const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'wali_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: console.log
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL数据库连接成功');

    // 生产环境不自动同步，避免索引冲突
    if (process.env.NODE_ENV === 'production') {
      console.log('生产环境，跳过自动表同步');
    } else {
      await sequelize.sync({ force: false });
      console.log('数据库表同步完成');
    }
  } catch (error) {
    console.error('无法连接到数据库:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  connectDB
};