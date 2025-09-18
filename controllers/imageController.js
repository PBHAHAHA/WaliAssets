
const volcengineService = require('../services/volcengineService');
const { consumeTokens } = require('./tokenController');
const { GenerationHistory } = require('../models');
const { sendSuccess, sendBusinessError, sendSystemError } = require('../utils/response');

exports.generateImage = async (req, res) => {
    const taskId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let historyRecord = null;

    try {
        const {
            prompt,
            size = "512x512",
            guidance_scale = 2.5,
            seed,
            watermark = false,
            image
        } = req.body;

        // 处理seed参数 - 火山引擎要求seed为正整数或不传
        let validSeed = undefined;
        if (seed !== undefined && seed !== null) {
            const parsedSeed = parseInt(seed);
            if (!isNaN(parsedSeed) && parsedSeed > 0 && parsedSeed <= 2147483647) {
                validSeed = parsedSeed;
            }
        }

        if (!prompt || !prompt.trim()) {
            return sendBusinessError(res, 0, 'Prompt不能为空');
        }

        // 创建生成历史记录
        historyRecord = await GenerationHistory.create({
            userId: req.user.id,
            type: 'image',
            prompt,
            parameters: {
                size,
                guidance_scale,
                seed: validSeed,
                watermark,
                image
            },
            status: 'processing',
            taskId,
            tokenConsumed: req.tokenCost,
            progress: 0
        });

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
                seed: validSeed,
                watermark,
                taskId
            }
        );

        // 更新进度
        await historyRecord.update({ progress: 30 });

        let model, params;
        model = "doubao-seedream-3-0-t2i-250415";
        params = {
            model,
            prompt,
            size,
            guidance_scale,
            watermark
        };

        // 只有当seed有效时才添加到参数中
        if (validSeed !== undefined) {
            params.seed = validSeed;
        }

        console.log("开始生成图像");

        // 更新进度
        await historyRecord.update({ progress: 50 });

        const result = await volcengineService.generateImage(params);

        // 更新生成成功状态
        await historyRecord.update({
            status: 'completed',
            resultUrl: result.data[0].url,
            resultUrls: result.data.map(item => item.url),
            progress: 100
        });

        return sendSuccess(res, {
            taskId,
            image_url: result.data[0].url,
            tokenConsumed: req.tokenCost
        }, `图片生成成功，消耗 ${req.tokenCost} tokens`);
    } catch (error) {
        console.error('图像生成错误:', error);

        // 更新失败状态
        if (historyRecord) {
            await historyRecord.update({
                status: 'failed',
                errorMessage: error.message,
                progress: 0
            });
        }

        if (error.message.includes('Token余额不足')) {
            return sendBusinessError(res, 0, error.message);
        }

        if (error.message.includes('生成失败') || error.message.includes('AI服务')) {
            return sendBusinessError(res, 0, error.message);
        }

        return sendSystemError(res, '图片生成失败', { taskId });
    }
}