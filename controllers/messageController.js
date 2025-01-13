const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');

exports.getMessagesByChatId = async (req, res) => {
  try {
    const { chat_id } = req.params;
    console.log(chat_id);

    //sort in ascending timestamp order
    const messages = await Message.find({ chatId: chat_id }).sort({ timestamp: 1 });

    if (!messages) {
      return res.status(200).json({ messages: [] });
    }
    console.log(messages);
    console.log(messages[0]);
    const userId = messages[0].senderId;
    const chat = await Chat.findOne({ _id: chat_id });

    if (!chat) {
      return res.status(404).json({ error: 'Chat Not Found' });
    }

    const recipientId = chat.participants.find(participant => participant !== userId);
    const recipient = recipientId ? await User.findById(recipientId) : null;

    const messageList = messages.map(msg => ({
      sender_id: msg.senderId,
      recipients_nickname: recipient ? recipient.nickname : '',
      recipients_avatar_url: recipient ? recipient.avatarUrl : '',
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