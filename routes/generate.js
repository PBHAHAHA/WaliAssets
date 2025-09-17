const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

const imageController = require('../controllers/imageController');
const animationController = require('../controllers/animationController');
const { authenticateToken } = require('../middleware/auth');
const { requireTokens } = require('../middleware/tokenConsume');
const { GenerationHistory } = require('../models');
const { sendSuccess, sendBusinessError, sendSystemError, BUSINESS_CODES } = require('../utils/response');

// 图像生成接口
router.post('/image',
    authenticateToken,
    requireTokens('IMAGE_GENERATION'),
    imageController.generateImage
);

// 动画生成接口
router.post('/animation',
    authenticateToken,
    requireTokens('VIDEO_GENERATION'),
    animationController.generateAnimation
);

// 获取生成任务状态
router.get('/status/:taskId',
    authenticateToken,
    async (req, res) => {
        try {
            const { taskId } = req.params;
            const userId = req.user.id;

            const task = await GenerationHistory.findOne({
                where: {
                    taskId,
                    userId
                }
            });

            if (!task) {
                return sendBusinessError(res, BUSINESS_CODES.GENERATION_TASK_NOT_FOUND, '任务不存在');
            }

            return sendSuccess(res, {
                taskId: task.taskId,
                status: task.status,
                progress: task.progress,
                type: task.type,
                resultUrl: task.resultUrl,
                resultUrls: task.resultUrls,
                errorMessage: task.errorMessage,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt
            });
        } catch (error) {
            console.error('查询任务状态错误:', error);
            return sendSystemError(res, '查询任务状态失败');
        }
    }
);

// 获取用户生成历史
router.get('/history',
    authenticateToken,
    async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                type,
                status,
                startDate,
                endDate
            } = req.query;
            const userId = req.user.id;
            const offset = (page - 1) * limit;

            // 构建查询条件
            const whereCondition = { userId };

            if (type && ['image', 'animation'].includes(type)) {
                whereCondition.type = type;
            }

            if (status && ['pending', 'processing', 'completed', 'failed'].includes(status)) {
                whereCondition.status = status;
            }

            // 日期范围筛选
            if (startDate || endDate) {
                whereCondition.createdAt = {};
                if (startDate) {
                    whereCondition.createdAt[Op.gte] = new Date(startDate);
                }
                if (endDate) {
                    whereCondition.createdAt[Op.lte] = new Date(endDate);
                }
            }

            // 查询历史记录
            const { count, rows } = await GenerationHistory.findAndCountAll({
                where: whereCondition,
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset),
                attributes: [
                    'id',
                    'type',
                    'prompt',
                    'parameters',
                    'status',
                    'taskId',
                    'resultUrl',
                    'resultUrls',
                    'tokenConsumed',
                    'errorMessage',
                    'progress',
                    'createdAt',
                    'updatedAt'
                ]
            });

            // 格式化数据
            const formattedHistory = rows.map(item => ({
                id: item.id,
                type: item.type,
                prompt: item.prompt,
                parameters: item.parameters,
                status: item.status,
                taskId: item.taskId,
                resultUrl: item.resultUrl,
                resultUrls: item.resultUrls,
                tokenConsumed: item.tokenConsumed,
                errorMessage: item.errorMessage,
                progress: item.progress,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            }));

            // 统计信息
            const totalTokensConsumed = rows.reduce((sum, item) => sum + item.tokenConsumed, 0);

            return sendSuccess(res, {
                history: formattedHistory,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                },
                summary: {
                    totalGenerated: count,
                    totalTokensConsumed: totalTokensConsumed
                }
            });
        } catch (error) {
            console.error('获取生成历史错误:', error);
            return sendSystemError(res, '获取生成历史失败');
        }
    }
);

// 删除生成历史记录
router.delete('/history/:id',
    authenticateToken,
    async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const deleted = await GenerationHistory.destroy({
                where: {
                    id,
                    userId
                }
            });

            if (deleted === 0) {
                return sendBusinessError(res, BUSINESS_CODES.GENERATION_TASK_NOT_FOUND, '记录不存在');
            }

            return sendSuccess(res, null, '删除成功');
        } catch (error) {
            console.error('删除生成历史错误:', error);
            return sendSystemError(res, '删除生成历史失败');
        }
    }
);

module.exports = router;