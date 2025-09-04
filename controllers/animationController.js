const volcengineService = require('../services/volcengineService');

exports.generateAnimation = async (req, res) => {
    try {
        // 创建任务
      const createResponse = await this.client.post('/content_generation/tasks', {
        model: params.model,
        content: params.content
      });
      
      const taskId = createResponse.data.id;
      
      // 轮询任务状态
      let result;
      do {
        await new Promise(resolve => setTimeout(resolve, 3000));
        result = await this.client.get(`/content_generation/tasks/${taskId}`);
      } while (result.data.status === 'processing');
      
      if (result.data.status === 'succeeded') {
        return { video_url: result.data.content.video_url.trim() };
      } else {
        throw new Error(`动画生成失败: ${result.data.error?.message || '未知错误'}`);
      }
    } catch (error) {
        console.error('动画生成错误:', error);
        res.status(500).json({ error: error.message });
    }
}
