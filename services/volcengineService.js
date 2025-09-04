const axios = require('axios');
const config = require('../config');

class VolcengineService {
  constructor() {
    this.baseURL = config.VOLCENGINE.BASE_URL;
    this.apiKey = config.VOLCENGINE.API_KEY;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async generateImage(params) {
    try {
      const response = await this.client.post('/images/generations', params);
      return response.data;
    } catch (error) {
      throw new Error(`图像生成失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async generateAnimation(params) {
    try {
        // 创建任务
        const createResponse = await this.client.post('/contents/generations/tasks', {
            model: params.model,
            content: params.content
        });
        const taskId = createResponse.data.id;
        // 轮询任务状态
        let result;
        do {
            await new Promise(resolve => setTimeout(resolve, 3000));
            result = await this.client.get(`/contents/generations/tasks/${taskId}`);
        } while (result.data.status === 'running');
        
        if (result.data.status === 'succeeded') {
            return { video_url: result.data.content.video_url.trim() };
        } else if (result.data.status === 'failed') {
            throw new Error(`动画生成失败: ${result.data.error?.message || '任务执行失败'}`);
        } else {
            throw new Error(`动画生成失败: 未知状态 ${result.data.status}`);
        }
    } catch (error) {
        throw new Error(`动画生成失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

}

module.exports = new VolcengineService();