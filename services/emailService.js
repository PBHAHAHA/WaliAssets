const nodemailer = require('nodemailer');

// 邮件发送配置
const createTransporter = () => {
  // 这里使用环境变量配置SMTP服务器
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };

  return nodemailer.createTransporter(config);
};

/**
 * 发送验证码邮件
 * @param {string} to 收件人邮箱
 * @param {string} code 验证码
 * @param {string} type 验证类型 (register/login/reset_password)
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, code, type = 'register') => {
  const transporter = createTransporter();

  const typeMap = {
    register: '注册',
    login: '登录',
    reset_password: '重置密码'
  };

  const subject = `WALI - ${typeMap[type]}验证码`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">WALI</h1>
          <p style="color: #666; margin: 10px 0 0 0;">AI图像与视频生成平台</p>
        </div>

        <h2 style="color: #333; text-align: center;">${typeMap[type]}验证码</h2>

        <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #1e90ff; font-size: 32px; margin: 0; letter-spacing: 5px; font-family: 'Courier New', monospace;">
            ${code}
          </h1>
        </div>

        <p style="color: #666; text-align: center; margin: 20px 0;">
          请在 <strong>10分钟</strong> 内使用此验证码完成${typeMap[type]}
        </p>

        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            如果您没有进行此操作，请忽略这封邮件。
          </p>
          <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
            此邮件由系统自动发送，请勿回复。
          </p>
        </div>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"WALI" <${process.env.SMTP_USER}>`,
    to: to,
    subject: subject,
    html: html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('邮件发送成功:', info.messageId);
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('邮件发送失败:', error);
    throw new Error('邮件发送失败: ' + error.message);
  }
};

/**
 * 测试邮件服务配置
 * @returns {Promise<boolean>}
 */
const testEmailService = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('邮件服务配置正常');
    return true;
  } catch (error) {
    console.error('邮件服务配置错误:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  testEmailService
};