const User = require('../models/User');

exports.getRecipients = async (req, res) => {
  try {
    const { recipient_id } = req.params;
    const recipient = await User.findById(recipient_id);

    const resData = {
      id: recipient_id,
      nickname: recipient.nickname,
      avatar_url: recipient.avatarUrl,
    }

    res.status(200).json({ recipient: resData });
  } catch (error) {
    res.status(500).json({error: error.message});
  }

}