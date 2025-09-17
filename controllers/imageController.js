
const volcengineService = require('../services/volcengineService');
const { consumeTokens } = require('./tokenController');
const { GenerationHistory } = require('../models');
const { sendSuccess, sendBusinessError, sendSystemError, BUSINESS_CODES } = require('../utils/response');

exports.generateImage = async (req, res) => {
    const taskId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let historyRecord = null;

    try {
        const {
            prompt,
            size = "512x512",
            guidance_scale = 2.5,
            seed = 12345,
            watermark = false,
            image
        } = req.body;

        if (!prompt || !prompt.trim()) {
            return sendBusinessError(res, BUSINESS_CODES.PARAM_INVALID, 'Prompt不能为空');
        }

        // 创建生成历史记录
        historyRecord = await GenerationHistory.create({
            userId: req.user.id,
            type: 'image',
            prompt,
            parameters: {
                size,
                guidance_scale,
                seed,
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
                seed,
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
            seed,
            watermark
        };

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
            return sendBusinessError(res, BUSINESS_CODES.TOKEN_INSUFFICIENT, error.message);
        }

        if (error.message.includes('生成失败') || error.message.includes('AI服务')) {
            return sendBusinessError(res, BUSINESS_CODES.GENERATION_TASK_FAILED, error.message);
        }

        return sendSystemError(res, '图片生成失败', { taskId });
    }
}