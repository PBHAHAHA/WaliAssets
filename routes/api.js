const express = require('express');
const router = express.Router();

const imageController = require('../controllers/imageController');
const animationController = require('../controllers/animationController');
router.get("/", (req, res) => {
    res.json({
        message: "Hello World"
    })
})

// 图像生成
router.post('/generate-image', imageController.generateImage);
// 动画生成
router.post('/generate-animation', animationController.generateAnimation);

module.exports = router;