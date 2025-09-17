/**
 * 统一API响应格式工具
 */

// 业务状态码定义
const BUSINESS_CODES = {
  // 成功
  SUCCESS: 1,

  // 通用错误
  BUSINESS_ERROR: 0,

  // 认证相关错误 (1000-1099)
  AUTH_TOKEN_INVALID: 1001,
  AUTH_TOKEN_EXPIRED: 1002,
  AUTH_TOKEN_MISSING: 1003,
  AUTH_LOGIN_FAILED: 1004,
  AUTH_USER_NOT_FOUND: 1005,
  AUTH_USER_DISABLED: 1006,
  AUTH_PASSWORD_INCORRECT: 1007,

  // 邮箱验证相关错误 (1100-1199)
  EMAIL_DOMAIN_NOT_SUPPORTED: 1101,
  EMAIL_CODE_INVALID: 1102,
  EMAIL_CODE_EXPIRED: 1103,
  EMAIL_CODE_USED: 1104,
  EMAIL_SEND_TOO_FREQUENT: 1105,
  EMAIL_SEND_FAILED: 1106,
  EMAIL_ALREADY_REGISTERED: 1107,

  // 用户相关错误 (1200-1299)
  USER_NOT_FOUND: 1201,
  USER_ALREADY_EXISTS: 1202,
  USER_PERMISSION_DENIED: 1203,

  // Token余额相关错误 (1300-1399)
  TOKEN_INSUFFICIENT: 1301,
  TOKEN_TRANSACTION_FAILED: 1302,

  // 支付相关错误 (1400-1499)
  PAYMENT_CONFIG_INCOMPLETE: 1401,
  PAYMENT_ORDER_NOT_FOUND: 1402,
  PAYMENT_AMOUNT_MISMATCH: 1403,
  PAYMENT_STATUS_ERROR: 1404,
  PAYMENT_SIGNATURE_INVALID: 1405,
  PAYMENT_PACKAGE_INVALID: 1406,

  // 生成功能相关错误 (1500-1599)
  GENERATION_TASK_NOT_FOUND: 1501,
  GENERATION_TASK_FAILED: 1502,
  GENERATION_PARAMS_INVALID: 1503,
  GENERATION_SERVICE_ERROR: 1504,

  // 参数验证错误 (1600-1699)
  PARAM_MISSING: 1601,
  PARAM_INVALID: 1602,
  PARAM_FORMAT_ERROR: 1603,

  // 系统错误 (9000-9999)
  SYSTEM_ERROR: 9000,
  DATABASE_ERROR: 9001,
  NETWORK_ERROR: 9002,
  SERVICE_UNAVAILABLE: 9003
};

// 错误码对应的默认消息
const CODE_MESSAGES = {
  [BUSINESS_CODES.SUCCESS]: '操作成功',
  [BUSINESS_CODES.BUSINESS_ERROR]: '业务处理失败',

  // 认证相关
  [BUSINESS_CODES.AUTH_TOKEN_INVALID]: '无效的token',
  [BUSINESS_CODES.AUTH_TOKEN_EXPIRED]: 'token已过期',
  [BUSINESS_CODES.AUTH_TOKEN_MISSING]: '缺少认证token',
  [BUSINESS_CODES.AUTH_LOGIN_FAILED]: '登录失败',
  [BUSINESS_CODES.AUTH_USER_NOT_FOUND]: '用户不存在',
  [BUSINESS_CODES.AUTH_USER_DISABLED]: '账户已被禁用',
  [BUSINESS_CODES.AUTH_PASSWORD_INCORRECT]: '密码错误',

  // 邮箱验证相关
  [BUSINESS_CODES.EMAIL_DOMAIN_NOT_SUPPORTED]: '邮箱域名不支持',
  [BUSINESS_CODES.EMAIL_CODE_INVALID]: '验证码无效',
  [BUSINESS_CODES.EMAIL_CODE_EXPIRED]: '验证码已过期',
  [BUSINESS_CODES.EMAIL_CODE_USED]: '验证码已使用',
  [BUSINESS_CODES.EMAIL_SEND_TOO_FREQUENT]: '验证码发送过于频繁',
  [BUSINESS_CODES.EMAIL_SEND_FAILED]: '邮件发送失败',
  [BUSINESS_CODES.EMAIL_ALREADY_REGISTERED]: '邮箱已被注册',

  // 用户相关
  [BUSINESS_CODES.USER_NOT_FOUND]: '用户不存在',
  [BUSINESS_CODES.USER_ALREADY_EXISTS]: '用户已存在',
  [BUSINESS_CODES.USER_PERMISSION_DENIED]: '权限不足',

  // Token余额相关
  [BUSINESS_CODES.TOKEN_INSUFFICIENT]: 'Token余额不足',
  [BUSINESS_CODES.TOKEN_TRANSACTION_FAILED]: 'Token交易失败',

  // 支付相关
  [BUSINESS_CODES.PAYMENT_CONFIG_INCOMPLETE]: '支付服务配置不完整',
  [BUSINESS_CODES.PAYMENT_ORDER_NOT_FOUND]: '订单不存在',
  [BUSINESS_CODES.PAYMENT_AMOUNT_MISMATCH]: '订单金额不匹配',
  [BUSINESS_CODES.PAYMENT_STATUS_ERROR]: '支付状态异常',
  [BUSINESS_CODES.PAYMENT_SIGNATURE_INVALID]: '签名验证失败',
  [BUSINESS_CODES.PAYMENT_PACKAGE_INVALID]: '无效的套餐类型',

  // 生成功能相关
  [BUSINESS_CODES.GENERATION_TASK_NOT_FOUND]: '任务不存在',
  [BUSINESS_CODES.GENERATION_TASK_FAILED]: '生成失败',
  [BUSINESS_CODES.GENERATION_PARAMS_INVALID]: '生成参数无效',
  [BUSINESS_CODES.GENERATION_SERVICE_ERROR]: '生成服务错误',

  // 参数验证
  [BUSINESS_CODES.PARAM_MISSING]: '缺少必要参数',
  [BUSINESS_CODES.PARAM_INVALID]: '参数无效',
  [BUSINESS_CODES.PARAM_FORMAT_ERROR]: '参数格式错误',

  // 系统错误
  [BUSINESS_CODES.SYSTEM_ERROR]: '系统内部错误',
  [BUSINESS_CODES.DATABASE_ERROR]: '数据库错误',
  [BUSINESS_CODES.NETWORK_ERROR]: '网络错误',
  [BUSINESS_CODES.SERVICE_UNAVAILABLE]: '服务不可用'
};

/**
 * 创建成功响应
 * @param {*} data 响应数据
 * @param {string} message 自定义消息
 * @returns {Object} 响应对象
 */
const success = (data = null, message = null) => {
  return {
    success: true,
    code: BUSINESS_CODES.SUCCESS,
    message: message || CODE_MESSAGES[BUSINESS_CODES.SUCCESS],
    data
  };
};

/**
 * 创建业务错误响应
 * @param {number} code 业务错误码
 * @param {string} message 自定义错误消息
 * @param {*} data 额外数据
 * @returns {Object} 响应对象
 */
const businessError = (code = BUSINESS_CODES.BUSINESS_ERROR, message = null, data = null) => {
  return {
    success: false,
    code,
    message: message || CODE_MESSAGES[code] || '未知错误',
    data
  };
};

/**
 * 创建系统错误响应
 * @param {string} message 错误消息
 * @param {*} data 额外数据
 * @returns {Object} 响应对象
 */
const systemError = (message = null, data = null) => {
  return {
    success: false,
    code: BUSINESS_CODES.SYSTEM_ERROR,
    message: message || CODE_MESSAGES[BUSINESS_CODES.SYSTEM_ERROR],
    data
  };
};

/**
 * 发送成功响应
 * @param {Object} res Express响应对象
 * @param {*} data 响应数据
 * @param {string} message 自定义消息
 * @param {number} httpStatus HTTP状态码，默认200
 */
const sendSuccess = (res, data = null, message = null, httpStatus = 200) => {
  res.status(httpStatus).json(success(data, message));
};

/**
 * 发送业务错误响应
 * @param {Object} res Express响应对象
 * @param {number} code 业务错误码
 * @param {string} message 自定义错误消息
 * @param {*} data 额外数据
 * @param {number} httpStatus HTTP状态码，默认200
 */
const sendBusinessError = (res, code = BUSINESS_CODES.BUSINESS_ERROR, message = null, data = null, httpStatus = 200) => {
  res.status(httpStatus).json(businessError(code, message, data));
};

/**
 * 发送系统错误响应
 * @param {Object} res Express响应对象
 * @param {string} message 错误消息
 * @param {*} data 额外数据
 * @param {number} httpStatus HTTP状态码，默认500
 */
const sendSystemError = (res, message = null, data = null, httpStatus = 500) => {
  res.status(httpStatus).json(systemError(message, data));
};

module.exports = {
  BUSINESS_CODES,
  CODE_MESSAGES,
  success,
  businessError,
  systemError,
  sendSuccess,
  sendBusinessError,
  sendSystemError
};