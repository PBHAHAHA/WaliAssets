# WALI 后端配置说明

## 环境变量配置

所有配置都通过 `.env` 文件进行设置。以下是必需的环境变量：

### 数据库配置

```env
# MySQL数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wali_db
DB_USER=root
DB_PASS=your_password
```

### JWT配置

```env
# JWT密钥和过期时间
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
```

### 服务器配置

```env
# 服务器端口
PORT=3334
NODE_ENV=development
```

### 邮件服务配置（邮箱验证功能）

WALI平台使用SMTP发送邮箱验证码，需要配置邮件服务器信息：

```env
# SMTP邮件服务器配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 邮件服务配置详解

### 使用Gmail配置SMTP

1. **启用两步验证**
   - 登录你的Gmail账户
   - 进入 [Google账户设置](https://myaccount.google.com/)
   - 选择"安全性"选项卡
   - 启用"两步验证"

2. **生成应用专用密码**
   - 在"安全性"页面中，找到"应用专用密码"
   - 选择应用类型为"邮件"
   - 选择设备类型
   - 点击"生成"按钮
   - 复制生成的16位密码（格式：xxxx xxxx xxxx xxxx）

3. **配置环境变量**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=yourproject@gmail.com
   SMTP_PASS=abcdwxyzabcdwxyz  # 16位应用专用密码（去掉空格）
   ```

### 使用QQ邮箱配置SMTP

1. **开启SMTP服务**
   - 登录QQ邮箱
   - 进入"设置" -> "账户"
   - 找到"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
   - 开启"IMAP/SMTP服务"
   - 会得到一个授权码

2. **配置环境变量**
   ```env
   SMTP_HOST=smtp.qq.com
   SMTP_PORT=587
   SMTP_USER=yourproject@qq.com
   SMTP_PASS=your_authorization_code  # QQ邮箱授权码
   ```

### 使用其他邮件服务商

#### 163邮箱
```env
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=yourproject@163.com
SMTP_PASS=your_authorization_code
```

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=yourproject@outlook.com
SMTP_PASS=your_password
```

### 测试邮件配置

在服务器启动时，系统会自动测试邮件服务配置。你也可以手动测试：

```javascript
const { testEmailService } = require('./services/emailService');

// 测试邮件服务
testEmailService()
  .then(result => {
    if (result) {
      console.log('邮件服务配置正常');
    } else {
      console.log('邮件服务配置有问题');
    }
  });
```

## 支付配置（可选）

如果需要启用支付功能，需要配置支付服务商信息：

```env
# 易支付配置
ZPAY_API_URL=https://your-zpay-domain.com
ZPAY_PID=your_partner_id
ZPAY_KEY=your_secret_key
```

## 火山引擎配置

图片和视频生成功能需要火山引擎API：

```env
# 火山引擎配置
VOLCENGINE_ACCESS_KEY=your_access_key
VOLCENGINE_SECRET_KEY=your_secret_key
VOLCENGINE_REGION=cn-north-1
```

## 完整的.env文件示例

```env
# 服务器配置
PORT=3334
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wali_db
DB_USER=root
DB_PASS=your_mysql_password

# JWT配置
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
JWT_EXPIRE=7d

# 邮件服务配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=wali@gmail.com
SMTP_PASS=abcdwxyzabcdwxyz

# 火山引擎配置
VOLCENGINE_ACCESS_KEY=your_volcengine_access_key
VOLCENGINE_SECRET_KEY=your_volcengine_secret_key
VOLCENGINE_REGION=cn-north-1

# 支付配置（可选）
ZPAY_API_URL=https://your-zpay-domain.com
ZPAY_PID=your_partner_id
ZPAY_KEY=your_secret_key
```

## 安全注意事项

1. **永远不要提交.env文件到版本控制系统**
   - 确保`.env`在`.gitignore`文件中
   - 使用`.env.example`作为模板

2. **定期更换密钥**
   - JWT_SECRET应该是随机生成的强密码
   - 邮箱密码应该使用应用专用密码，不是登录密码

3. **生产环境配置**
   - 使用强密码
   - 启用SSL/TLS
   - 限制数据库访问权限

## 故障排除

### 支付服务错误

1. **Invalid URL 错误**
   ```
   Error: Invalid URL at new URL
   ```
   - 检查 `.env` 文件中的 `ZPAY_URL` 是否设置
   - 确认支付服务商URL格式正确（以http://或https://开头）
   - 如果不使用支付功能，可以设置虚拟值避免错误

2. **支付服务配置不完整**
   ```
   Error: 支付服务配置不完整，请联系管理员
   ```
   - 检查 `ZPAY_URL`, `ZPAY_PID`, `ZPAY_PKEY` 是否都已设置
   - 联系支付服务商获取正确的配置信息

### 邮件发送失败

1. **检查SMTP配置**
   ```
   Error: Invalid login
   ```
   - 确认用户名密码正确
   - 对于Gmail，确保使用应用专用密码
   - 对于QQ邮箱，确保使用授权码

2. **检查网络连接**
   ```
   Error: Connection timeout
   ```
   - 确认SMTP服务器地址正确
   - 检查防火墙设置
   - 确认端口587或465可访问

3. **检查邮箱设置**
   ```
   Error: Authentication failed
   ```
   - 确认已开启SMTP服务
   - 确认两步验证已启用（Gmail）
   - 重新生成应用专用密码

### 数据库连接失败

```
Error: Access denied for user
```
- 检查数据库用户名密码
- 确认数据库服务器正在运行
- 检查数据库权限设置

### JWT Token问题

```
Error: jwt malformed
```
- 检查JWT_SECRET是否设置
- 确认JWT_SECRET足够长（推荐32字符以上）
- 检查客户端是否正确发送Authorization头

## 开发环境快速设置

1. **复制环境变量模板**
   ```bash
   cp .env.example .env
   ```

2. **编辑.env文件**
   ```bash
   nano .env
   ```

3. **安装依赖**
   ```bash
   npm install
   # 或
   pnpm install
   ```

4. **同步数据库**
   ```bash
   node scripts/syncDatabase.js
   ```

5. **启动服务**
   ```bash
   npm run dev
   ```

## 生产环境部署

1. **设置环境变量**
   ```env
   NODE_ENV=production
   ```

2. **使用PM2管理进程**
   ```bash
   npm install -g pm2
   pm2 start server.js --name wali-backend
   ```

3. **配置反向代理**
   使用Nginx配置SSL和反向代理到Node.js应用。