const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');
const { authenticateToken } = require('../middleware/auth');

router.get('/balance', authenticateToken, tokenController.getTokenBalance);
router.get('/history', authenticateToken, tokenController.getTokenHistory);
router.post('/recharge', authenticateToken, tokenController.rechargeTokens);
router.get('/cost/:type', authenticateToken, tokenController.checkTokenCost);

module.exports = router;