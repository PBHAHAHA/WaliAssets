# 易支付模块 API 文档

## 概述

本系统集成了易支付（ZPay）作为支付服务提供商，支持支付宝和微信支付两种支付方式。用户可以通过购买不同的Token套餐来为账户充值。

## 易支付配置信息

- **接口地址**: https://zpayz.cn/
- **商户ID**: 2025012415175410
- **支付方式**: 支付宝(alipay)、微信支付(wxpay)

## API 接口

### 1. 获取支付套餐列表

**请求**
```
GET /api/payment/packages
Authorization: Bearer <token>
```

**响应**
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
      },
      {
        "id": "package_500",
        "tokens": 500,
        "price": 4.50,
        "name": "500 Tokens"
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

### 2. 创建支付订单

**请求**
```
POST /api/payment/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "package": "package_100",
  "paymentType": "alipay",
  "returnUrl": "http://your-domain.com/payment/success" // 可选
}
```

**响应**
```json
{
  "success": true,
  "message": "订单创建成功",
  "data": {
    "orderId": 1,
    "outTradeNo": "1726418400000123",
    "tradeNo": "ZP2024091512001",
    "payUrl": "https://zpayz.cn/pay/alipay/xxxxx",
    "qrCode": "https://zpayz.cn/qrcode/xxxxx.jpg",
    "amount": 1.00,
    "tokenAmount": 100
  }
}
```

### 3. 查询订单状态

**请求**
```
GET /api/payment/query?orderId=1
# 或者
GET /api/payment/query?outTradeNo=1726418400000123
Authorization: Bearer <token>
```

**响应**
```json
{
  "success": true,
  "data": {
    "localOrder": {
      "id": 1,
      "outTradeNo": "1726418400000123",
      "tradeNo": "ZP2024091512001",
      "name": "100 Tokens",
      "money": "1.00",
      "type": "alipay",
      "status": 1,
      "tokenAmount": 100,
      "createdAt": "2024-09-15T12:00:00.000Z",
      "paidAt": "2024-09-15T12:05:00.000Z"
    },
    "remoteOrder": {
      "tradeNo": "ZP2024091512001",
      "outTradeNo": "1726418400000123",
      "status": 1,
      "buyer": "138****1234"
    }
  }
}
```

### 4. 获取订单列表

**请求**
```
GET /api/payment/orders?page=1&limit=10&status=1
Authorization: Bearer <token>
```

**响应**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 1,
        "outTradeNo": "1726418400000123",
        "name": "100 Tokens",
        "money": "1.00",
        "type": "alipay",
        "status": 1,
        "tokenAmount": 100,
        "createdAt": "2024-09-15T12:00:00.000Z",
        "paidAt": "2024-09-15T12:05:00.000Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

### 5. 申请退款

**请求**
```
POST /api/payment/refund/1
Authorization: Bearer <token>
```

**响应**
```json
{
  "success": true,
  "message": "退款成功",
  "data": {
    "orderId": 1,
    "refundAmount": "1.00"
  }
}
```

### 6. 支付回调接口（内部使用）

**请求**
```
POST /api/payment/notify
Content-Type: application/x-www-form-urlencoded

pid=2025012415175410&trade_no=ZP2024091512001&out_trade_no=1726418400000123&type=alipay&name=100%20Tokens&money=1.00&trade_status=TRADE_SUCCESS&sign=xxxxx&sign_type=MD5
```

**响应**
```
success
```

## Token套餐配置

| 套餐ID | Token数量 | 价格(元) | 套餐名称 |
|--------|----------|----------|----------|
| package_100 | 100 | 1.00 | 100 Tokens |
| package_500 | 500 | 4.50 | 500 Tokens |
| package_1000 | 1000 | 8.00 | 1000 Tokens |
| package_2000 | 2000 | 15.00 | 2000 Tokens |
| package_5000 | 5000 | 35.00 | 5000 Tokens |

## 订单状态说明

- `0`: 未支付
- `1`: 已支付
- `2`: 已退款

## 使用流程

1. 前端调用 `/api/payment/packages` 获取套餐列表
2. 用户选择套餐和支付方式，调用 `/api/payment/create` 创建订单
3. 前端根据返回的 `payUrl` 或 `qrCode` 引导用户支付
4. 支付完成后，易支付会调用回调接口通知支付结果
5. 前端可以通过 `/api/payment/query` 查询订单状态
6. 支付成功后，系统自动为用户充值对应的Token数量

## 错误处理

所有API都遵循统一的错误响应格式：

```json
{
  "success": false,
  "message": "错误描述"
}
```

常见错误：
- `400`: 请求参数错误
- `401`: 未授权（需要登录）
- `404`: 资源不存在
- `500`: 服务器内部错误

## 安全注意事项

1. 所有支付相关接口都需要用户认证
2. 支付回调接口会验证易支付的签名
3. 订单金额会在回调时进行二次验证
4. 系统支持重复通知处理，确保数据一致性

## 测试建议

在测试环境中，可以使用较小的金额（如0.01元）进行测试，确保支付流程正常工作。