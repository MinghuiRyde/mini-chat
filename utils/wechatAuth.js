const axios = require('axios');

const getSessionKeyAndOpenId = async (jsCode) => {
  const appId = process.env.WECHAT_APPID;
  const appSecret = process.env.WECHAT_APP_SECRET;
  const url =
    `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${jsCode}&grant_type=authorization_code`

  console.log(url);

  const response = await axios.get(url);
  console.log('Response ', response.data);

  if (response.data.errorcode) {
    throw new Error(`WeChat API Error: ${response.data.errmsg}`);
  }

  return {
    openId: response.data.openid,
    sessionKey: response.data.session_key,
  };

};

module.exports = {getSessionKeyAndOpenId};