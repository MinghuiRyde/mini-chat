const Chat = require('../models/Chat');
const User = require('../models/User');
const crypto = require('crypto');

exports.getChatsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    console.log(user_id);
    const chats = await Chat.find({participants: user_id});
    const user = await User.findById(user_id);

    if (!chats) {
      return res.status(404).json({error: 'no chats found'});
    }
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
        recipients_id: recipientId,
        recipients_nickname: recipient ? recipient.nickname : user.nickname,
        recipients_avatar_url: recipient ? recipient.avatarUrl : user.avatarUrl,
        last_message: chat.lastMessage,
        last_message_time: chat.lastMessageTimestamp,
        unread_count: chat.unreadCount,
      };
    });

    const resData = { chats: chatList };
    res.status(200).json(resData);
  } catch (error) {
    return res.status(500).json({error: error.message});
  }
};

exports.createChat = async (req, res) => {
  const { user_a, user_b } = req.body;

  if (!user_a || !user_b) {
    return res.status(400).json({error: 'One or more user id missing'});
  }

  if (! await User.findById(user_a) || ! await User.findById(user_b)) {
    return res.status(401).json({error: 'Some user dose not exist in the database'});
  }

  try {
    const seed = [user_a, user_b].sort().join('_');
    const hash = crypto.createHash('sha256').update(seed).digest('base64');
    const chatId = hash.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
    let chat = await Chat.findById(chatId);

    if (!chat) {
      chat = new Chat({
        _id: chatId,
        lastMessage: '',
        lastMessageTimestamp: new Date(),
        participants: [user_a, user_b],
        unreadCount: 0,
      });
      await chat.save();
    }
    res.status(200).json({ chat_id: chatId });
  } catch (error) {
    console.log(error);
    res.status(500).json({error: error.message});
  }
}