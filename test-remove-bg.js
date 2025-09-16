const axios = require('axios');

const testRemoveBackground = async () => {
  try {
    console.log('开始测试抠图API...');
    
    const response = await axios.post('http://localhost:3001/api/remove-background', {
      image_url: 'https://www.koukoutu.com/images/cbanner3_bg.jpg',
      output_format: 'png',
      crop: 0,
      border: 0,
      stamp_crop: 0,
      response: 'url'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('测试成功！');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('错误详情:', error.response.data);
    }
  }
};

testRemoveBackground();