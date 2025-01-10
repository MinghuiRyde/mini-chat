const Chat = require('../models/Chat');

exports.getChatsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.openId !== userId) {
      return res.status(403).json({error: 'Unauthorized access'});
    }

    const chats = await Chat.find({participants: userId});
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
};