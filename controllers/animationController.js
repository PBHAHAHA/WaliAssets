const volcengineService = require('../services/volcengineService');

exports.generateAnimation = async (req, res) => {
    try {
        const { model, content } = req.body;
        
        if (!model || !content) {
            return res.status(400).json({ error: '缺少必要参数: model 和 content' });
        }
        
        const result = await volcengineService.generateAnimation({ model, content });
        res.json(result);
    } catch (error) {
        console.error('动画生成错误:', error);
        res.status(500).json({ error: error.message });
    }
}
