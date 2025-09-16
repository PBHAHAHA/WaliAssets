const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const tokenRoutes = require('./token');
const paymentRoutes = require('./payment');
const generateRoutes = require('./generate');

router.get("/", (req, res) => {
    res.json({
        message: "Hello World"
    })
})

// 认证路由
router.use('/auth', authRoutes);

// Token路由
router.use('/token', tokenRoutes);

// 支付路由
router.use('/payment', paymentRoutes);

// 生成路由
router.use('/generate', generateRoutes);

module.exports = router;