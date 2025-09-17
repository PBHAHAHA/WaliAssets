const express = require('express');
const router = express.Router();
const {
  createPayment,
  queryOrder,
  getOrderList,
  requestRefund,
  paymentNotify,
  getPaymentPackages,
  testPaymentSuccess
} = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

router.get('/packages', authenticateToken, getPaymentPackages);

router.post('/create', authenticateToken, createPayment);

router.get('/query', authenticateToken, queryOrder);

router.get('/orders', authenticateToken, getOrderList);

router.post('/refund/:orderId', authenticateToken, requestRefund);

router.post('/notify', paymentNotify);

// 测试接口：手动触发支付成功（开发调试用）
router.post('/test-success/:orderId', authenticateToken, testPaymentSuccess);

module.exports = router;