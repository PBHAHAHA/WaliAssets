const volcengineService = require('../services/volcengineService');
const { consumeTokens } = require('./tokenController');

exports.generateAnimation = async (req, res) => {
    try {
        const { model, content } = req.body;
        
        if (!model || !content) {
            return res.status(400).json({ 
                success: false,
                error: '缺少必要参数: model 和 content' 
            });
        }

        console.log("开始消耗token并生成动画");
        
        await consumeTokens(
            req.user.id,
            'VIDEO_GENERATION',
            req.tokenCost,
            `视频生成 - Model: ${model}, Content: ${content.toString().substring(0, 50)}...`,
            { 
                model,
                content
            }
        );
        
        console.log("开始生成动画");
        const result = await volcengineService.generateAnimation({ model, content });
        
        res.json({
            success: true,
            message: `视频生成成功，消耗 ${req.tokenCost} tokens`,
            data: {
                ...result,
                tokenConsumed: req.tokenCost
            }
        });
    } catch (error) {
        console.error('动画生成错误:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}
