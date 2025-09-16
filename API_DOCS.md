# WaliAssets API 文档

## 基础信息

- **基础URL**: `http://localhost:3334/api`
- **认证方式**: JWT Bearer Token
- **请求格式**: JSON
- **响应格式**: JSON

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "message": "操作成功",
  "data": {}
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误信息"
}
```

## 认证相关 `/api/auth`

### 用户注册
- **接口**: `POST /api/auth/register`
- **描述**: 用户注册
- **请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username"
}
```

### 用户登录
- **接口**: `POST /api/auth/login`
- **描述**: 用户登录
- **请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **响应**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "username",
      "tokenBalance": 100
    }
  }
}
```

## Token管理 `/api/token`

### 获取Token余额
- **接口**: `GET /api/token/balance`
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "data": {
    "balance": 100
  }
}
```

### 获取Token使用历史
- **接口**: `GET /api/token/transactions`
- **认证**: 需要
- **查询参数**:
  - `page`: 页码 (默认: 1)
  - `limit`: 每页数量 (默认: 10)
  - `type`: 交易类型 (可选)

## 支付相关 `/api/payment`

### 创建支付订单
- **接口**: `POST /api/payment/create`
- **认证**: 需要
- **请求体**:
```json
{
  "package": "package_100",
  "paymentType": "alipay",
  "returnUrl": "http://example.com/return"
}
```

### 查询订单状态
- **接口**: `GET /api/payment/query`
- **认证**: 需要
- **查询参数**:
  - `orderId`: 订单ID
  - `outTradeNo`: 商户订单号

### 获取支付套餐
- **接口**: `GET /api/payment/packages`
- **响应**:
```json
{
  "success": true,
  "data": {
    "packages": [
      {
        "id": "package_100",
        "tokens": 100,
        "price": 1.00,
        "name": "100 Tokens"
      }
    ],
    "paymentTypes": [
      {
        "id": "alipay",
        "name": "支付宝",
        "icon": "alipay"
      }
    ]
  }
}
```

## 生成功能 `/api/generate`

**生成功能接口总览**:
- `POST /api/generate/image` - 图像生成
- `POST /api/generate/animation` - 动画生成
- `GET /api/generate/status/:taskId` - 查询任务状态
- `GET /api/generate/history` - 获取生成历史
- `DELETE /api/generate/history/:id` - 删除历史记录

### 图像生成
- **接口**: `POST /api/generate/image`
- **认证**: 需要
- **Token消耗**: IMAGE_GENERATION 类型
- **请求体**:
```json
{
  "prompt": "一只可爱的小猫",
  "size": "512x512",
  "guidance_scale": 2.5,
  "seed": 12345,
  "watermark": true
}
```
- **响应**:
```json
{
  "success": true,
  "message": "图片生成成功，消耗 10 tokens",
  "data": {
    "taskId": "img_1234567890_abc123",
    "image_url": "https://example.com/image.jpg",
    "tokenConsumed": 10
  }
}
```

### 动画生成
- **接口**: `POST /api/generate/animation`
- **认证**: 需要
- **Token消耗**: VIDEO_GENERATION 类型
- **请求体**:
```json
{
  "model": "animation_model",
  "content": "动画内容描述或图像数据"
}
```
- **响应**:
```json
{
  "success": true,
  "message": "视频生成成功，消耗 50 tokens",
  "data": {
    "taskId": "anim_1234567890_abc123",
    "video_url": "https://example.com/video.mp4",
    "tokenConsumed": 50
  }
}
```

### 查询任务状态
- **接口**: `GET /api/generate/status/:taskId`
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "data": {
    "taskId": "img_1234567890_abc123",
    "status": "completed",
    "progress": 100,
    "type": "image",
    "resultUrl": "https://example.com/image.jpg",
    "resultUrls": ["https://example.com/image.jpg"],
    "errorMessage": null,
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:01:00Z"
  }
}
```

**任务状态说明**:
- `pending`: 等待处理
- `processing`: 正在生成
- `completed`: 生成完成
- `failed`: 生成失败

### 获取生成历史
- **接口**: `GET /api/generate/history`
- **认证**: 需要
- **查询参数**:
  - `page`: 页码 (默认: 1)
  - `limit`: 每页数量 (默认: 10)
  - `type`: 生成类型 (可选: image, animation)
  - `status`: 状态筛选 (可选: pending, processing, completed, failed)
  - `startDate`: 开始日期 (可选: YYYY-MM-DD)
  - `endDate`: 结束日期 (可选: YYYY-MM-DD)
- **响应**:
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": 1,
        "type": "image",
        "prompt": "一只可爱的小猫",
        "parameters": {
          "size": "512x512",
          "guidance_scale": 2.5,
          "seed": 12345,
          "watermark": true
        },
        "status": "completed",
        "taskId": "img_1234567890_abc123",
        "resultUrl": "https://example.com/image.jpg",
        "resultUrls": ["https://example.com/image.jpg"],
        "tokenConsumed": 10,
        "errorMessage": null,
        "progress": 100,
        "createdAt": "2024-01-01T12:00:00Z",
        "updatedAt": "2024-01-01T12:01:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    },
    "summary": {
      "totalGenerated": 1,
      "totalTokensConsumed": 10
    }
  }
}
```

### 删除生成历史
- **接口**: `DELETE /api/generate/history/:id`
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "message": "删除成功"
}
```

## 错误代码

| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未认证或Token无效 |
| 403 | Token余额不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## Token套餐

| 套餐ID | Token数量 | 价格 | 名称 |
|--------|-----------|------|------|
| package_100 | 100 | ¥1.00 | 100 Tokens |
| package_500 | 500 | ¥4.50 | 500 Tokens |
| package_1000 | 1000 | ¥8.00 | 1000 Tokens |
| package_2000 | 2000 | ¥15.00 | 2000 Tokens |
| package_5000 | 5000 | ¥35.00 | 5000 Tokens |

## Token消耗

| 功能 | 消耗类型 | 消耗数量 |
|------|----------|----------|
| 图像生成 | IMAGE_GENERATION | 根据配置 |
| 动画生成 | VIDEO_GENERATION | 根据配置 |

## 认证说明

大部分接口需要在请求头中包含JWT Token：

```
Authorization: Bearer <your_jwt_token>
```

## 示例请求

### 使用curl进行图像生成

```bash
curl -X POST http://localhost:3334/api/generate/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只可爱的小猫",
    "size": "512x512",
    "guidance_scale": 2.5,
    "seed": 12345,
    "watermark": true
  }'
```

### 使用JavaScript进行支付

```javascript
const response = await fetch('/api/payment/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    package: 'package_100',
    paymentType: 'alipay',
    returnUrl: window.location.origin + '/payment/success'
  })
});

const result = await response.json();
```

### 查询生成历史

```javascript
const response = await fetch('/api/generate/history?page=1&limit=5&type=image&status=completed', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const result = await response.json();
console.log('生成历史:', result.data.history);
console.log('总计消耗token:', result.data.summary.totalTokensConsumed);
```