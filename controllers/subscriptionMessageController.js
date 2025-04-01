const axios = require('axios');
const WECHAT_APP_ID = process.env.WECHAT_APPID;
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET;

async function getAccessToken() {
    try {
        const response = await axios.get(
            `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}`
        );

        if (response.data.access_token) {
            return response.data.access_token;
        } else {
            throw new Error(`Error fetching access token: ${response.data.errmsg}`);
        }
    } catch (error) {
        console.error('Failed to get access token:', error.message);
        throw error;
    }
}

async function sendSubscriptionMessage(data, openId) {
    try {
        const accessToken = await getAccessToken();
        const response = await axios.post(
            `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
            {
                touser: openId,
                template_id: "FifXBWUvxSllt_W_eh-STye2chZ-oyEiT8Kn8vGBMIc",
                page:'/pages/home',
                data,
                miniprogram_state: 'developer',
                lang: 'en_US'
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log("response body ", JSON.stringify({
            touser: openId,
            template_id: "FifXBWUvxSllt_W_eh-STye2chZ-oyEiT8Kn8vGBMIc",
            page:'/pages/home',
            data,
            miniprogram_state: 'developer',
            lang: 'en_US'
        }));
        console.log("response from subscription server", JSON.stringify(response.data));
        if (response.data.errcode === 0) {
            console.log('Message sent successfully:', response.data);
        } else {
            console.error('Error sending message:', response.data);
        }
    } catch (error) {
        console.error('Failed to send subscription message:', error.message);
    }
}

module.exports = { sendSubscriptionMessage };