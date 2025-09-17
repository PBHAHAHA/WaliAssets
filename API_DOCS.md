# WaliAssets API 文档

## 基础信息

- **基础URL**: `http://localhost:3334/api`
- **认证方式**: JWT Bearer Token
- **请求格式**: JSON
- **响应格式**: JSON

## 通用响应格式

**重要更新**: 所有API接口现在使用统一的响应格式，HTTP状态码通常为200，业务状态通过`code`字段表示。

### 成功响应
```json
{
  "success": true,
  "code": 1,
  "message": "操作成功",
  "data": {}
}
```

### 业务错误响应
```json
{
  "success": false,
  "code": 1001,
  "message": "无效的token",
  "data": null
}
```

### 系统错误响应
```json
{
  "success": false,
  "code": 9000,
  "message": "系统内部错误",
  "data": null
}
```

## 认证相关 `/api/auth`

### 发送邮箱验证码
- **接口**: `POST /api/auth/send-code`
- **描述**: 发送邮箱验证码
- **支持邮箱**: qq.com, gmail.com, googlemail.com
- **请求体**:
```json
{
  "email": "user@qq.com",
  "type": "register"
}
```
- **成功响应**:
```json
{
  "success": true,
  "code": 1,
  "message": "验证码已发送到您的邮箱，请查收",
  "data": {
    "email": "user@qq.com",
    "expiresIn": 600
  }
}
```
- **错误响应**:
```json
{
  "success": false,
  "code": 1101,
  "message": "暂时只支持以下邮箱注册：qq.com, gmail.com",
  "data": {
    "allowedDomains": ["qq.com", "gmail.com"]
  }
}
```

### 用户注册
- **接口**: `POST /api/auth/register`
- **描述**: 用户注册（需要邮箱验证码）
- **请求体**:
```json
{
  "email": "user@qq.com",
  "password": "password123",
  "username": "username",
  "emailCode": "123456"
}
```
- **成功响应**:
```json
{
  "success": true,
  "code": 1,
  "message": "用户注册成功，获得 100 tokens奖励",
  "data": {
    "user": {
      "id": "uuid-string",
      "username": "username",
      "email": "user@qq.com",
      "tokenBalance": 100
    },
    "token": "jwt_token_here",
    "tokenBonus": 100
  }
}
```
- **错误响应**:
```json
{
  "success": false,
  "code": 1102,
  "message": "验证码无效",
  "data": null
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
- **成功响应**:
```json
{
  "success": true,
  "code": 1,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "user@qq.com",
      "username": "username",
      "tokenBalance": 100
    },
    "token": "jwt_token_here"
  }
}
```
- **错误响应**:
```json
{
  "success": false,
  "code": 1004,
  "message": "邮箱或密码错误",
  "data": null
}
```

## Token管理 `/api/token`

### 获取Token余额
- **接口**: `GET /api/token/balance`
- **认证**: 需要
- **成功响应**:
```json
{
  "success": true,
  "code": 1,
  "message": "操作成功",
  "data": {
    "balance": 100,
    "user": {
      "id": "uuid-string",
      "username": "username",
      "email": "user@qq.com"
    }
  }
}
```
- **错误响应**:
```json
{
  "success": false,
  "code": 1001,
  "message": "无效的token",
  "data": null
}
```

### 获取Token使用历史
- **接口**: `GET /api/token/transactions`
- **认证**: 需要
- **查询参数**:
  - `page`: 页码 (默认: 1)
  - `limit`: 每页数量 (默认: 20)
  - `type`: 交易类型 (可选)
- **成功响应**:
```json
{
  "success": true,
  "code": 1,
  "message": "操作成功",
  "data": {
    "transactions": [
      {
        "id": 1,
        "type": "IMAGE_GENERATION",
        "amount": -20,
        "balance": 80,
        "description": "图像生成",
        "metadata": {
          "taskId": "img_1234567890_abc123"
        },
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

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
- **成功响应**:
```json
{
  "success": true,
  "code": 1,
  "message": "订单创建成功",
  "data": {
    "orderId": "order_123456",
    "outTradeNo": "trade_789012",
    "payUrl": "https://payment.example.com/pay?order=xxx",
    "qrCode": "https://qr.example.com/qrcode.png"
  }
}
```
- **错误响应**:
```json
{
  "success": false,
  "code": 1406,
  "message": "无效的套餐类型",
  "data": null
}
```

### 查询订单状态
- **接口**: `GET /api/payment/query`
- **认证**: 需要
- **查询参数**:
  - `orderId`: 订单ID
  - `outTradeNo`: 商户订单号
- **成功响应**:
```json
{
  "success": true,
  "code": 1,
  "message": "操作成功",
  "data": {
    "localOrder": {
      "id": "order_123456",
      "outTradeNo": "trade_789012",
      "tradeNo": "remote_trade_345678",
      "name": "100 Tokens",
      "money": 2.00,
      "type": "alipay",
      "status": 1,
      "tokenAmount": 100,
      "createdAt": "2024-01-01T12:00:00Z",
      "paidAt": "2024-01-01T12:05:00Z"
    },
    "remoteOrder": {
      "status": 1,
      "tradeNo": "remote_trade_345678",
      "totalFee": 2.00
    }
  }
}
```

### 获取支付套餐
- **接口**: `GET /api/payment/packages`
- **成功响应**:
```json
{
  "success": true,
  "code": 1,
  "message": "操作成功",
  "data": {
    "packages": [
      {
        "id": "package_100",
        "tokens": 100,
        "price": 2.00,
        "name": "100 Tokens"
      },
      {
        "id": "package_500",
        "tokens": 500,
        "price": 9.00,
        "name": "500 Tokens"
      },
      {
        "id": "package_1000",
        "tokens": 1000,
        "price": 16.00,
        "name": "1000 Tokens"
      }
    ],
    "paymentTypes": [
      {
        "id": "alipay",
        "name": "支付宝",
        "icon": "alipay"
      },
      {
        "id": "wxpay",
        "name": "微信支付",
        "icon": "wechat"
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
- **成功响应**:
```json
{
  "success": true,
  "code": 1,
  "message": "图片生成成功，消耗 20 tokens",
  "data": {
    "taskId": "img_1234567890_abc123",
    "image_url": "https://example.com/image.jpg",
    "tokenConsumed": 20
  }
}
```
- **Token不足错误**:
```json
{
  "success": false,
  "code": 1301,
  "message": "Token余额不足，当前余额: 5, 需要: 20",
  "data": {
    "currentBalance": 5,
    "required": 20,
    "shortfall": 15
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
- **成功响应**:
```json
{
  "success": true,
  "code": 1,
  "message": "视频生成成功，消耗 100 tokens",
  "data": {
    "taskId": "anim_1234567890_abc123",
    "video_url": "https://example.com/video.mp4",
    "tokenConsumed": 100
  }
}
```
- **Token不足错误**:
```json
{
  "success": false,
  "code": 1301,
  "message": "Token余额不足，当前余额: 50, 需要: 100",
  "data": {
    "currentBalance": 50,
    "required": 100,
    "shortfall": 50
  }
}
```

### 查询任务状态
- **接口**: `GET /api/generate/status/:taskId`
- **认证**: 需要
- **成功响应**:
```json
{
  "success": true,
  "code": 1,
  "message": "操作成功",
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
- **任务不存在错误**:
```json
{
  "success": false,
  "code": 1501,
  "message": "任务不存在",
  "data": null
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
- **成功响应**:
```json
{
  "success": true,
  "code": 1,
  "message": "操作成功",
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
        "tokenConsumed": 20,
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
      "totalTokensConsumed": 20
    }
  }
}
```

### 删除生成历史
- **接口**: `DELETE /api/generate/history/:id`
- **认证**: 需要
- **成功响应**:
```json
{
  "success": true,
  "code": 1,
  "message": "删除成功",
  "data": null
}
```
- **权限不足错误**:
```json
{
  "success": false,
  "code": 1203,
  "message": "权限不足",
  "data": null
}
```

## 邮箱验证说明

### 支持的邮箱域名
- **qq.com** - QQ邮箱
- **gmail.com** - 谷歌邮箱

### 验证码规则
- **格式**: 6位随机数字
- **有效期**: 10分钟
- **发送频率**: 每个邮箱1分钟内只能发送一次
- **验证次数**: 每个验证码最多尝试3次
- **使用限制**: 验证码只能使用一次，使用后自动失效

### 注册流程
1. 调用 `/auth/send-code` 发送验证码到邮箱
2. 用户收到邮箱验证码（6位数字）
3. 调用 `/auth/register` 提交注册信息和验证码
4. 验证通过后完成注册，获得100 tokens奖励

## 业务错误代码

**重要**: 所有业务错误HTTP状态码均为200，具体错误信息通过响应体中的`code`字段判断。详细的业务错误码定义请参考 [BUSINESS_CODES.md](./BUSINESS_CODES.md)

### 常用错误码

| 业务码 | 说明 |
|--------|------|
| 1 | 操作成功 |
| 1001 | 无效的token |
| 1002 | token已过期 |
| 1003 | 缺少认证token |
| 1004 | 登录失败 |
| 1101 | 邮箱域名不支持 |
| 1102 | 验证码无效 |
| 1103 | 验证码已过期 |
| 1301 | Token余额不足 |
| 1406 | 无效的套餐类型 |
| 1501 | 任务不存在 |
| 9000 | 系统内部错误 |

## Token套餐

| 套餐ID | Token数量 | 价格 | 名称 |
|--------|-----------|------|------|
| package_100 | 100 | ¥2.00 | 100 Tokens |
| package_500 | 500 | ¥9.00 | 500 Tokens |
| package_1000 | 1000 | ¥16.00 | 1000 Tokens |
| package_2000 | 2000 | ¥30.00 | 2000 Tokens |
| package_5000 | 5000 | ¥70.00 | 5000 Tokens |

## Token消耗

| 功能 | 消耗类型 | 消耗数量 |
|------|----------|----------|
| 图像生成 | IMAGE_GENERATION | 20 tokens |
| 动画生成 | VIDEO_GENERATION | 100 tokens |

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

if (result.success) {
  console.log('支付订单创建成功:', result.data);
  // 跳转到支付页面
  window.location.href = result.data.payUrl;
} else {
  console.error('创建失败:', result.message, 'Code:', result.code);
  // 根据错误码处理不同错误
  switch (result.code) {
    case 1301:
      alert('Token余额不足，请先充值');
      break;
    case 1406:
      alert('无效的套餐类型');
      break;
    default:
      alert(result.message);
  }
}
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

if (result.success) {
  console.log('生成历史:', result.data.history);
  console.log('总计消耗token:', result.data.summary.totalTokensConsumed);
} else {
  console.error('获取历史失败:', result.message, 'Code:', result.code);
}
```