const crypto = require('crypto');

// 支持的邮箱域名
const ALLOWED_EMAIL_DOMAINS = [
  'qq.com',
  'gmail.com',
  'googlemail.com'
];

/**
 * 验证邮箱域名是否被支持
 * @param {string} email
 * @returns {boolean}
 */
const isEmailDomainAllowed = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailLower = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(emailLower)) {
    return false;
  }

  const domain = emailLower.split('@')[1];
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
};

/**
 * 生成6位数字验证码
 * @returns {string}
 */
const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * 获取邮箱域名
 * @param {string} email
 * @returns {string}
 */
const getEmailDomain = (email) => {
  if (!email || typeof email !== 'string') {
    return '';
  }
  return email.toLowerCase().trim().split('@')[1] || '';
};

/**
 * 获取支持的邮箱域名列表
 * @returns {Array<string>}
 */
const getAllowedDomains = () => {
  return [...ALLOWED_EMAIL_DOMAINS];
};

module.exports = {
  isEmailDomainAllowed,
  generateVerificationCode,
  getEmailDomain,
  getAllowedDomains,
  ALLOWED_EMAIL_DOMAINS
};