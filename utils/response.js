/**
 * 统一API响应格式工具
 */

/**
 * 创建成功响应
 * @param {*} data 响应数据
 * @param {string} message 自定义消息
 * @returns {Object} 响应对象
 */
const success = (data = null, message = null) => {
  return {
    success: true,
    code: 1,
    message: message || '操作成功',
    data
  };
};

/**
 * 创建业务错误响应
 * @param {number} code 业务错误码 (0或1)
 * @param {string} message 自定义错误消息
 * @param {*} data 额外数据
 * @returns {Object} 响应对象
 */
const businessError = (code = 0, message = null, data = null) => {
  return {
    success: false,
    code,
    message: message || '业务处理失败',
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
    code: 0,
    message: message || '系统内部错误',
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
 * @param {number} code 业务错误码 (0或1)
 * @param {string} message 自定义错误消息
 * @param {*} data 额外数据
 * @param {number} httpStatus HTTP状态码，默认200
 */
const sendBusinessError = (res, code = 0, message = null, data = null, httpStatus = 200) => {
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
  success,
  businessError,
  systemError,
  sendSuccess,
  sendBusinessError,
  sendSystemError
};