# FrameForge 后端迁移指南：从Python到Node.js

## 迁移概述

本文档详细说明如何将FrameForge的Python FastAPI后端迁移到Node.js Express后端。

## 当前Python后端分析

### 核心组件
1. **主应用** (`main.py`): FastAPI应用，包含所有API端点
2. **芯片音乐生成** (`chiptune_generation.py`): 复杂的音频处理和AI集成
3. **配置文件** (`config.py`): 应用配置和版本信息

### 主要功能
- **图像生成**: 文生图、图生图 (火山引擎API)
- **动画生成**: 视频生成 (火山引擎API) 
- **芯片音乐生成**: AI生成+音频合成
- **帧拆分**: 视频帧提取 (OpenCV)
- **静态文件服务**: 前端构建文件
- **CORS支持**: 跨域请求
- **定时清理**: 临时文件管理

### 依赖项
```
fastapi==0.68.0
uvicorn==0.15.0
opencv-python==4.5.3.56
requests==2.25.1
volcenginesdkarkruntime (火山引擎SDK)
pydub (音频处理)
numpy (数值计算)
```

## Node.js后端架构设计

### 技术栈选择
- **框架**: Express.js 4.x
- **HTTP客户端**: axios
- **文件上传**: multer
- **视频处理**: fluent-ffmpeg (替代OpenCV)
- **音频处理**: web-audio-api-node (替代pydub+numpy)
- **定时任务**: node-cron
- **火山引擎SDK**: @volcengine/openapi

### 项目结构
```
backend-node/
├── package.json
├── server.js                 # 主服务器文件
├── config/
│   ├── index.js             # 配置管理
│   └── volcengine.js        # 火山引擎配置
├── controllers/
│   ├── imageController.js   # 图像生成
│   ├── animationController.js # 动画生成
│   ├── chiptuneController.js  # 芯片音乐
│   └── framesController.js    # 帧处理
├── services/
│   ├── volcengineService.js # AI服务
│   ├── audioService.js      # 音频处理
│   └── fileService.js       # 文件管理
├── middleware/
│   ├── cors.js              # CORS中间件
│   └── errorHandler.js      # 错误处理
├── utils/
│   ├── cleanup.js           # 定时清理
│   └── helpers.js           # 工具函数
└── public/                  # 静态文件目录
```

## 分步迁移计划

### 步骤1: 创建Node.js项目基础结构

#### 1.1 初始化项目
```bash
cd backend-node
npm init -y
```

#### 1.2 安装核心依赖
```bash
# 核心框架
npm install express cors dotenv

# HTTP和工具
npm install axios multer uuid

# 视频/音频处理
npm install fluent-ffmpeg web-audio-api-node

# 火山引擎SDK (可能需要自定义实现)
npm install @volcengine/openapi

# 定时任务
npm install node-cron

# 开发依赖
npm install --save-dev nodemon
```

#### 1.3 创建package.json脚本
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "echo 'No build step required'"
  }
}
```

### 步骤2: 迁移核心服务器配置

#### 2.1 创建主服务器文件 (server.js)
```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));

// API路由
app.use('/api', require('./routes/api'));

// 前端路由处理
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`FrameForge服务器运行在端口 ${PORT}`);
});
```

#### 2.2 创建配置文件 (config/index.js)
```javascript
module.exports = {
  PROJECT_NAME: "FrameForge",
  VERSION: "0.2.4",
  VOLCENGINE: {
    BASE_URL: "https://ark.cn-beijing.volces.com/api/v3",
    API_KEY: process.env.ARK_API_KEY,
    MODELS: {
      TEXT_TO_IMAGE: "doubao-seedream-3-0-t2i-250415",
      IMAGE_TO_IMAGE: "doubao-seededit-3-0-i2i-250628", 
      ANIMATION: "doubao-seedance-1-0-pro-250528",
      TEXT_COMPLETION: "doubao-1-5-lite-32k-250115",
      CHIPTUNE: "doubao-1-5-pro-256k-250115"
    }
  },
  AUDIO: {
    SAMPLE_RATE: 44100,
    VOLUME: 0.3,
    BIT_DEPTH: 16
  }
};
```

### 步骤3: 迁移API端点

#### 3.1 创建路由文件 (routes/api.js)
```javascript
const express = require('express');
const router = express.Router();

// 控制器导入
const imageController = require('../controllers/imageController');
const animationController = require('../controllers/animationController');
const chiptuneController = require('../controllers/chiptuneController');
const framesController = require('../controllers/framesController');

// 健康检查
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'FrameForge' });
});

// 图像生成
router.post('/generate-image', imageController.generateImage);

// 提示词生成
router.post('/generate-prompt', imageController.generatePrompt);

// 动画生成
router.post('/generate-animation', animationController.generateAnimation);

// 芯片音乐生成
router.post('/generate-chiptune', chiptuneController.generateChiptune);

// 帧拆分
router.post('/split-frames', framesController.splitFrames);

module.exports = router;
```

#### 3.2 图像生成控制器 (controllers/imageController.js)
```javascript
const volcengineService = require('../services/volcengineService');

exports.generateImage = async (req, res) => {
  try {
    const { prompt, size = "512x512", guidance_scale = 2.5, seed = 12345, watermark = true, image } = req.body;
    
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt不能为空' });
    }

    let model, params;
    if (image && image.trim()) {
      // 图生图
      model = "doubao-seededit-3-0-i2i-250628";
      params = {
        model,
        prompt,
        image: image.trim(),
        size: "adaptive",
        guidance_scale,
        seed,
        watermark
      };
    } else {
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
    }

    const result = await volcengineService.generateImage(params);
    res.json({ image_url: result.data[0].url });
    
  } catch (error) {
    console.error('图像生成错误:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.generatePrompt = async (req, res) => {
  try {
    const { user_request } = req.body;
    
    if (!user_request || !user_request.trim()) {
      return res.status(400).json({ error: '用户需求不能为空' });
    }

    const result = await volcengineService.generateText({
      model: "doubao-1-5-lite-32k-250115",
      messages: [
        {
          role: "system",
          content: "你是一个AI提示词专家..."
        },
        {
          role: "user", 
          content: user_request
        }
      ]
    });

    res.json({ generated_prompt: result.choices[0].message.content });
    
  } catch (error) {
    console.error('提示词生成错误:', error);
    res.status(500).json({ error: error.message });
  }
};
```

### 步骤4: 迁移火山引擎服务

#### 4.1 火山引擎服务 (services/volcengineService.js)
```javascript
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

  async generateText(params) {
    try {
      const response = await this.client.post('/chat/completions', params);
      return response.data;
    } catch (error) {
      throw new Error(`文本生成失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async generateAnimation(params) {
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
      throw new Error(`动画生成失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

module.exports = new VolcengineService();
```

### 步骤5: 迁移芯片音乐生成 (最复杂的部分)

#### 5.1 音频服务基础 (services/audioService.js)
```javascript
const fs = require('fs');
const path = require('path');
const { AudioContext } = require('web-audio-api');

class AudioService {
  constructor() {
    this.sampleRate = 44100;
    this.volume = 0.3;
    this.bitDepth = 16;
    
    // 音符频率映射
    this.noteFrequencies = {
      'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
      'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
      'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
    };
  }

  noteToFrequency(note) {
    if (!note) return 0;
    
    const octave = parseInt(note[0]);
    const noteName = note.slice(1);
    const baseFreq = this.noteFrequencies[noteName] || this.noteFrequencies['A'];
    
    return baseFreq * Math.pow(2, octave - 4);
  }

  generateSquareWave(frequency, duration, pulseWidth = 0.5) {
    const numSamples = Math.floor(this.sampleRate * duration);
    const samples = new Float32Array(numSamples);
    
    for (let i = 0; i < numSamples; i++) {
      const time = i / this.sampleRate;
      const period = 1.0 / frequency;
      const phase = (time % period) / period;
      samples[i] = phase < pulseWidth ? 1.0 : -1.0;
    }
    
    return samples;
  }

  generateTriangleWave(frequency, duration) {
    const numSamples = Math.floor(this.sampleRate * duration);
    const samples = new Float32Array(numSamples);
    
    for (let i = 0; i < numSamples; i++) {
      const time = i / this.sampleRate;
      const phase = (time * frequency) % 1;
      samples[i] = 2 * Math.abs(2 * (phase - Math.floor(phase + 0.5))) - 1;
    }
    
    return samples;
  }

  // ... 更多音频处理方法
}

module.exports = new AudioService();
```

### 步骤6: 迁移视频处理

#### 6.1 帧处理控制器 (controllers/framesController.js)
```javascript
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

exports.splitFrames = async (req, res) => {
  try {
    const { video_url, interval = 1.0, count = 10 } = req.body;
    
    // 下载视频
    const tempVideoPath = `temp_video_${Date.now()}.mp4`;
    // 使用axios下载视频到本地
    
    // 创建帧目录
    const frameDir = path.join(__dirname, '../frames', `frames_${Date.now()}`);
    fs.mkdirSync(frameDir, { recursive: true });
    
    return new Promise((resolve, reject) => {
      ffmpeg(tempVideoPath)
        .outputOptions([
          `-vf fps=1/${interval}`,
          `-frames:v ${count}`
        ])
        .output(path.join(frameDir, 'frame_%d.jpg'))
        .on('end', () => {
          // 生成URL列表
          const frames = [];
          for (let i = 1; i <= count; i++) {
            frames.push(`/frames/${path.basename(frameDir)}/frame_${i}.jpg`);
          }
          
          // 清理临时文件
          fs.unlinkSync(tempVideoPath);
          
          res.json({ frames });
        })
        .on('error', reject)
        .run();
    });
    
  } catch (error) {
    console.error('帧拆分错误:', error);
    res.status(500).json({ error: error.message });
  }
};
```

### 步骤7: 创建构建和部署脚本

#### 7.1 更新package.json
```json
{
  "name": "frameforge-backend-node",
  "version": "0.2.4",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build:frontend": "cd ../frontend && npm run build && cp -r build ../backend-node/",
    "build": "npm run build:frontend",
    "postinstall": "echo 'Backend dependencies installed'"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "axios": "^1.3.0",
    "multer": "^1.4.5",
    "fluent-ffmpeg": "^2.1.2",
    "web-audio-api": "^0.2.2",
    "node-cron": "^3.0.0",
    "dotenv": "^16.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.0"
  }
}
```

#### 7.2 创建Docker支持 (可选)
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8000

CMD ["npm", "start"]
```

### 步骤8: 更新构建脚本

#### 8.1 修改build.py支持Node.js
```python
def build_nodejs_backend():
    """构建Node.js后端"""
    print("开始构建Node.js后端...")
    
    backend_node_dir = PROJECT_ROOT / "backend-node"
    
    # 安装Node.js依赖
    run_command(["npm", "install"], cwd=backend_node_dir)
    
    # 如果需要，可以使用pkg打包为可执行文件
    # run_command(["npx", "pkg", "server.js", "--output", "frameforge"], cwd=backend_node_dir)
    
    print("Node.js后端构建完成")
```

## 迁移注意事项

### 功能对等性检查表
- [ ] 图像生成API (文生图、图生图)
- [ ] 动画生成API  
- [ ] 芯片音乐生成API (复杂度最高)
- [ ] 帧拆分API
- [ ] 静态文件服务
- [ ] CORS支持
- [ ] 错误处理
- [ ] 定时清理
- [ ] 环境变量配置

### 技术挑战
1. **音频处理复杂度**: Python的numpy+pydub功能需要在Node.js中重新实现
2. **火山引擎SDK**: 可能需要自己实现HTTP客户端
3. **视频处理**: OpenCV功能需要用FFmpeg替代
4. **数值计算**: numpy的音频处理逻辑需要纯JavaScript实现

### 建议分阶段迁移
1. **阶段1**: 基础API端点 (图像、动画、提示词)
2. **阶段2**: 帧拆分功能
3. **阶段3**: 芯片音乐生成 (最复杂)
4. **阶段4**: 优化和性能调优

### 测试策略
- API功能对比测试
- 性能基准测试  
- 并发负载测试
- 错误处理测试

这个迁移方案提供了详细的分步指导，可以帮助你逐步将Python后端迁移到Node.js。