const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../controllers/userController');

// 获取所有注册用户 (需要校验码)
router.get('/all', getAllUsers);

module.exports = router;