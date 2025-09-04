
const volcengineService = require('../services/volcengineService');
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
            return res.status(400).json({ error: 'Prompt不能为空' });
        }

        let model, params;
        // 文生图
        model = "doubao-seedream-3-0-t2i-250415";
        params = {
            model,
            prompt,
            size,
            guidance_scale,
            seed,
            watermark
        };
        console.log("开始生成图像")
        const result = await volcengineService.generateImage(params);
        res.json({ image_url: result.data[0].url });
    } catch (error) {
        console.error('图像生成错误:', error);
        res.status(500).json({ error: error.message });
    }
}