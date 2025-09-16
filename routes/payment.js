const express = require('express');
const router = express.Router();
const {
  createPayment,
  queryOrder,
  getOrderList,
  requestRefund,
  paymentNotify,
  getPaymentPackages
} = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

router.get('/packages', authenticateToken, getPaymentPackages);

router.post('/create', authenticateToken, createPayment);

router.get('/query', authenticateToken, queryOrder);

router.get('/orders', authenticateToken, getOrderList);

router.post('/refund/:orderId', authenticateToken, requestRefund);

router.post('/notify', paymentNotify);

module.exports = router;