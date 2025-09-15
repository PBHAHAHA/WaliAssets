
const volcengineService = require('../services/volcengineService');
const { consumeTokens } = require('./tokenController');

exports.generateImage = async (req, res) => {
    try {
        const { 
            prompt, 
            size = "512x512",
            guidance_scale = 2.5,
            seed = 12345, 
            watermark = true, 
            image
        } = req.body;
        
        if (!prompt || !prompt.trim()) {
            return res.status(400).json({ 
                success: false,
                error: 'Prompt不能为空' 
            });
        }

        console.log("开始消耗token并生成图像");
        
        await consumeTokens(
            req.user.id,
            'IMAGE_GENERATION',
            req.tokenCost,
            `图片生成 - Prompt: ${prompt.substring(0, 50)}...`,
            { 
                prompt,
                size,
                guidance_scale,
                seed,
                watermark
            }
        );

        let model, params;
        model = "doubao-seedream-3-0-t2i-250415";
        params = {
            model,
            prompt,
            size,
            guidance_scale,
            seed,
            watermark
        };
        
        console.log("开始生成图像");
        const result = await volcengineService.generateImage(params);
        
        res.json({ 
            success: true,
            message: `图片生成成功，消耗 ${req.tokenCost} tokens`,
            data: {
                image_url: result.data[0].url,
                tokenConsumed: req.tokenCost
            }
        });
    } catch (error) {
        console.error('图像生成错误:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}