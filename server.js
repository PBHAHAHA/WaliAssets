const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');
// 加载环境变量
dotenv.config();
console.log(process.env.ARK_API_KEY);
const app = express();
const PORT = process.env.PORT || 8000;

// 中间件
app.use(cors());
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
app.listen(PORT, () => {
  console.log(`WaliAssets  服务器运行在端口 ${PORT}`);
});