const axios = require('axios');

const removeBackground = async (req, res) => {
  try {
    const { 
      image_url,
      output_format = 'png',
      crop = 0,
      border = 0,
      stamp_crop = 0,
      response = 'url'
    } = req.body;

    if (!image_url) {
      return res.status(400).json({
        code: 400,
        message: '图片URL是必填参数',
        data: null
      });
    }

    const apiKey = process.env.KOUKOUTU_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        code: 500,
        message: 'API密钥未配置',
        data: null
      });
    }

    const params = new URLSearchParams({
      model_key: 'background-removal',
      output_format,
      crop: crop.toString(),
      border: border.toString(),
      stamp_crop: stamp_crop.toString(),
      response
    });

    const response_data = await axios({
      method: 'POST',
      url: `https://sync.koukoutu.com/v1/create?${params.toString()}`,
      data: {
        image_url: image_url
      },
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });

    res.json(response_data.data);
    
  } catch (error) {
    console.error('抠图API错误:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        code: error.response.status,
        message: error.response.data?.message || '第三方API请求失败',
        data: null
      });
    }

    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

module.exports = {
  removeBackground
};