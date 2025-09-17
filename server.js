const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');
const { connectDB } = require('./config/database');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// 中间件
const corsOptions = {
  origin: [
    'https://pixel.iwali.cn',
    'http://pixel.iwali.cn',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));

// API路由
app.use('/api', apiRoutes);

// 前端路由处理
// app.get('/*', (req, res) => {
//   res.sendFile(path.join(buildPath, 'index.html'));
// });

// 启动服务器
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`WaliAssets  服务器运行在端口 ${PORT}`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

startServer();