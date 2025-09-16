const volcengineService = require('../services/volcengineService');
const { consumeTokens } = require('./tokenController');
const { GenerationHistory } = require('../models');

exports.generateAnimation = async (req, res) => {
    const taskId = `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let historyRecord = null;

    try {
        const { model, content } = req.body;

        if (!model || !content) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数: model 和 content'
            });
        }

        // 创建生成历史记录
        historyRecord = await GenerationHistory.create({
            userId: req.user.id,
            type: 'animation',
            prompt: typeof content === 'string' ? content : JSON.stringify(content),
            parameters: {
                model,
                content
            },
            status: 'processing',
            taskId,
            tokenConsumed: req.tokenCost,
            progress: 0
        });

        console.log("开始消耗token并生成动画");

        await consumeTokens(
            req.user.id,
            'VIDEO_GENERATION',
            req.tokenCost,
            `视频生成 - Model: ${model}, Content: ${content.toString().substring(0, 50)}...`,
            {
                model,
                content,
                taskId
            }
        );

        // 更新进度
        await historyRecord.update({ progress: 20 });

        console.log("开始生成动画");

        // 更新进度
        await historyRecord.update({ progress: 40 });

        const result = await volcengineService.generateAnimation({ model, content });

        // 更新生成成功状态
        await historyRecord.update({
            status: 'completed',
            resultUrl: result.video_url || result.url,
            resultUrls: result.videos || (result.video_url ? [result.video_url] : []),
            progress: 100,
            metadata: result
        });

        res.json({
            success: true,
            message: `视频生成成功，消耗 ${req.tokenCost} tokens`,
            data: {
                taskId,
                ...result,
                tokenConsumed: req.tokenCost
            }
        });
    } catch (error) {
        console.error('动画生成错误:', error);

        // 更新失败状态
        if (historyRecord) {
            await historyRecord.update({
                status: 'failed',
                errorMessage: error.message,
                progress: 0
            });
        }

        res.status(500).json({
            success: false,
            error: error.message,
            taskId
        });
    }
}
