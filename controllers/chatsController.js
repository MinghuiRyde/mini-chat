const Chat = require('../models/Chat');

exports.getChatsByUser = async (req, res) => {
  try {
    const userId = req.params.user_id;
    const chats = await Chat.find({participants: userId});

    if (!chats) {
      const resData = {
        user_id: userId,
        chats: [],
      }
      res.status(200).json(resData);
    } else {
      const resData = {
        user_id: userId,
        chats: chats.map(chat => ({
          chat_id: chat._id,
          last_message: chat.lastMessage,
          last_message_time: chat.lastMessageTimestamp,
          unread_count: chat.unreadCount,
        })),
      }
      res.status(200).json(resData);
    }
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
};