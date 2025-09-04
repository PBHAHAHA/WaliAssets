const dotenv = require('dotenv');
dotenv.config();
module.exports = {
    PROJECT_NAME: "WaliAssets",
    VERSION: "0.0.1",
    VOLCENGINE: {
        BASE_URL: "https://ark.cn-beijing.volces.com/api/v3",
        API_KEY: process.env.ARK_API_KEY,
    }
}