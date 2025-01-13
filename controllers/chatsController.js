const Chat = require('../models/Chat');
const User = require('../models/User');

exports.getChatsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const chats = await Chat.find({participants: user_id});
    const user = await User.findById(user_id);

    if (!chats) {
      res.status(200).json({ chats: [] });
    } else {
      const recipientIds = chats.map(chat => chat.participants.find(
        participant => participant !== user_id
      ));

      const recipients = await User.find({ _id: { $in: recipientIds } });

      const recipientMap = recipients.reduce((map, recipient) => {
        map[recipient._id] = recipient;
        return map;
      }, {});

      const chatList = chats.map(chat => {
        const recipientId = chat.participants.find(participant => participant !== user_id);
        const recipient = recipientMap[recipientId];
        return {
          chat_id: chat._id,
          recipients_nickname: recipient ? recipient.nickname : user.nickname,
          recipients_avatar_url: recipient ? recipient.avatarUrl : user.avatarUrl,
          last_message: chat.lastMessage,
          last_message_time: chat.lastMessageTimestamp,
          unread_count: chat.unreadCount,
        };
      });

      const resData = { chats: chatList };
      res.status(200).json(resData);
    }
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
};