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
      return res.status(404).json({error: 'no messages found'});
    }

    if (!messages.length) {
      return res.status(200).json({ messages: [] });
    }

    const chat = await Chat.findOne({ _id: chat_id });

    if (!chat) {
      return res.status(404).json({ error: 'Chat Not Found' });
    }

    const messageList = messages.map(msg => ({
      members: chat.participants,
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