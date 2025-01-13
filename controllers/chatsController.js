const Chat = require('../models/Chat');
const User = require('../models/User');

exports.getChatsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const chats = await Chat.find({participants: userId});

    if (!chats || chats.length === 0) {
      res.status(200).json({ chats: [] });
    } else {
      const recipientIds = chats.map(chat => chat.participants.find(
        participant => participant !== userId
      ));

      const recipients = await User.find({ _id: { $in: recipientIds } });

      const recipientMap = recipients.reduce((map, recipient) => {
        map[recipient._id] = recipient;
        return map;
      }, {});

      const chatList = chats.map(chat => {
        const recipientId = chat.participants.find(participant => participant !== userId);
        const recipient = recipientMap[recipientId];

        return {
          chat_id: chat._id,
          recipient_nickname: recipient ? recipient.nickname : '',
          recipient_avatar_url: recipient ? recipient.avatarUrl : '',
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