const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();
const ZPAY_CONFIG = {
  baseUrl: process.env.ZPAY_URL,
  pid: process.env.ZPAY_PID,
  key: process.env.ZPAY_PKEY,

  endpoints: {
    submit: '/submit.php',
    api: '/mapi.php',
    query: '/api.php'
  },

  paymentTypes: {
    ALIPAY: 'alipay',
    WXPAY: 'wxpay'
  },

  orderStatus: {
    UNPAID: 0,
    PAID: 1
  }
};

const generateOrderNo = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${timestamp}${random}`;
};

const sortParams = (params) => {
  const filtered = {};
  Object.keys(params)
    .filter(key => key !== 'sign' && key !== 'sign_type' && params[key] !== '' && params[key] != null)
    .sort()
    .forEach(key => {
      filtered[key] = params[key];
    });
  return filtered;
};

const createSignature = (params, key) => {
  const sortedParams = sortParams(params);
  const queryString = Object.keys(sortedParams)
    .map(k => `${k}=${sortedParams[k]}`)
    .join('&');

  const signStr = queryString + key;
  return crypto.createHash('md5').update(signStr).digest('hex');
};

const verifySignature = (params, key) => {
  const receivedSign = params.sign;
  const calculatedSign = createSignature(params, key);
  return receivedSign === calculatedSign;
};

module.exports = {
  ZPAY_CONFIG,
  generateOrderNo,
  createSignature,
  verifySignature
};