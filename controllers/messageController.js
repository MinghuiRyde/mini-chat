const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');

exports.getMessagesByChatId = async (req, res) => {
  try {
    const { chat_id } = req.params;
    console.log(chat_id);
    const chat = await Chat.findOne({ _id: chat_id });
    if (!chat) {
      return res.status(404).json({ error: 'Chat Not Found' });
    }

    //sort in ascending timestamp order
    const messages = await Message.find({ chatId: chat_id }).sort({ timestamp: 1 });

    if (!messages) {
      return res.status(404).json({error: 'no messages found'});
    }

    if (!messages.length) {
      return res.status(200).json({ messages: [] });
    }

    const senderId = messages[0].senderId;
    let receiverId = chat.participants.find(participant => participant !== senderId);
    receiverId = receiverId ? receiverId : chat.participants[0];
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    const messageList = messages.map(msg => ({
      sender: {
        user_id: senderId,
        nickname: sender.nickname,
        avatar_url: sender.avatarUrl,
      },
      receiver: {
        user_id: receiverId,
        nickname: receiver.nickname,
        avatar_url: receiver.avatarUrl,
      },
      content: msg.message,
      timestamp: msg.timestamp,
      status: msg.status
    }));

    res.status(200).json({ messages: messageList });

  } catch (error) {
    console.log('Error retrieving messages', error);
    res.status(500).json({error: 'Server Error with retrieving messages'});
  }
}