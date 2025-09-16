const express = require('express');
const router = express.Router();

const imageController = require('../controllers/imageController');
const animationController = require('../controllers/animationController');
const removeBackgroundController = require('../controllers/removeBackgroundController');
router.get("/", (req, res) => {
    res.json({
        message: "Hello World"
    })
})

// 图像生成
router.post('/generate-image', imageController.generateImage);
// 动画生成
router.post('/generate-animation', animationController.generateAnimation);
// 抠图
router.post('/remove-background', removeBackgroundController.removeBackground);

module.exports = router;