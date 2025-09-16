# WALI API文档

## 基础信息
- 基础URL: `http://localhost:3334/api`
- 所有请求和响应的Content-Type为: `application/json`

## Token系统说明
- 用户注册时获得100个免费tokens
- 图片生成消耗10 tokens
- 视频生成消耗50 tokens
- 所有生成操作需要登录和足够的token余额

## 认证接口

### 1. 用户注册
**POST** `/auth/register`

**请求体:**
```json
{
  "username": "testuser",
  "email": "test@example.com", 
  "password": "123456"
}
```

**响应:**
```json
{
  "success": true,
  "message": "用户注册成功",
  "data": {
    "user": {
      "id": "uuid",
      "username": "testuser",
      "email": "test@example.com",
      "avatar": null,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

### 2. 用户登录
**POST** `/auth/login`

**请求体:**
```json
{
  "email": "test@example.com",
  "password": "123456"
}
```

**响应:**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "uuid",
      "username": "testuser",
      "email": "test@example.com",
      "avatar": null,
      "isActive": true,
      "lastLoginAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

### 3. 获取用户信息
**GET** `/auth/profile`

**请求头:**
```
Authorization: Bearer <token>
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "testuser",
      "email": "test@example.com",
      "avatar": null,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 4. 更新用户信息
**PUT** `/auth/profile`

**请求头:**
```
Authorization: Bearer <token>
```

**请求体:**
```json
{
  "username": "newusername",
  "avatar": "https://example.com/avatar.jpg"
}
```

**响应:**
```json
{
  "success": true,
  "message": "用户信息更新成功",
  "data": {
    "user": {
      "id": "uuid",
      "username": "newusername",
      "email": "test@example.com",
      "avatar": "https://example.com/avatar.jpg",
      "isActive": true,
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## 错误响应格式

所有错误响应都遵循以下格式：

```json
{
  "success": false,
  "message": "错误描述"
}
```

常见错误状态码：
- 400: 请求参数错误
- 401: 未授权（token无效或过期）
- 404: 资源不存在
- 500: 服务器内部错误

## 数据库配置

确保你的MySQL数据库配置正确，更新`.env`文件中的数据库连接信息：

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wali_db
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your-super-secret-jwt-key
```

## Token管理接口

### 1. 获取Token余额
**GET** `/token/balance`

**请求头:**
```
Authorization: Bearer <token>
```

**响应:**
```json
{
  "success": true,
  "data": {
    "balance": 90,
    "user": {
      "id": "uuid",
      "username": "testuser",
      "email": "test@example.com"
    }
  }
}
```

### 2. 获取Token使用历史
**GET** `/token/history?page=1&limit=20`

**请求头:**
```
Authorization: Bearer <token>
```

**响应:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "type": "IMAGE_GENERATION",
        "amount": -10,
        "balance": 90,
        "description": "图片生成 - Prompt: a beautiful sunset...",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

### 3. 检查操作费用
**GET** `/token/cost/{type}`

支持的类型: `image_generation`, `video_generation`

**请求头:**
```
Authorization: Bearer <token>
```

**响应:**
```json
{
  "success": true,
  "data": {
    "type": "IMAGE_GENERATION",
    "cost": 10,
    "currentBalance": 90,
    "canAfford": true
  }
}
```

### 4. Token充值
**POST** `/token/recharge`

**请求头:**
```
Authorization: Bearer <token>
```

**请求体:**
```json
{
  "amount": 100,
  "paymentId": "payment_12345"
}
```

**响应:**
```json
{
  "success": true,
  "message": "成功充值 100 tokens",
  "data": {
    "success": true,
    "balance": 190,
    "transaction": {
      "type": "RECHARGE",
      "amount": 100,
      "description": "Token充值 - 支付ID: payment_12345"
    }
  }
}
```

## 内容生成接口

### 1. 生成图片
**POST** `/generate-image`

**请求头:**
```
Authorization: Bearer <token>
```

**请求体:**
```json
{
  "prompt": "a beautiful sunset over mountains",
  "size": "512x512",
  "guidance_scale": 2.5,
  "seed": 12345,
  "watermark": true
}
```

**响应:**
```json
{
  "success": true,
  "message": "图片生成成功，消耗 10 tokens",
  "data": {
    "image_url": "https://example.com/generated-image.jpg",
    "tokenConsumed": 10
  }
}
```

### 2. 生成视频
**POST** `/generate-animation`

**请求头:**
```
Authorization: Bearer <token>
```

**请求体:**
```json
{
  "model": "animation-model",
  "content": "animation description"
}
```

**响应:**
```json
{
  "success": true,
  "message": "视频生成成功，消耗 50 tokens",
  "data": {
    "video_url": "https://example.com/generated-video.mp4",
    "tokenConsumed": 50
  }
}
```

## 错误响应

### Token不足错误 (402)
```json
{
  "success": false,
  "message": "Token余额不足，当前余额: 5, 需要: 10",
  "data": {
    "currentBalance": 5,
    "required": 10,
    "shortfall": 5
  }
}
```

## 启动项目

1. 安装依赖: `npm install`
2. 配置数据库连接信息
3. 启动服务: `npm run dev`
4. 服务将运行在 `http://localhost:3334`

## Token系统特性
- 自动扣费：每次生成操作自动扣除对应tokens
- 余额保护：余额不足时拒绝操作
- 交易记录：完整的token使用历史
- 实时余额：随时查询当前token余额