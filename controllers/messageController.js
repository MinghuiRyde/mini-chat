const Message = require('../models/Message');

exports.getMessagesBy = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({ chatId }).sort({ timestamp: 1 });

    const messageList = messages.map(msg => ({
      message_id: msg.id,
      sender_id: msg.senderId,
      content: msg.message,
      timestamp: msg.timestamp,
      status: msg.status
    }));

    return res.json({
      chat_id: chatId,
      messages: messageList
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({error: 'Server Error with retrieving messages'});
  }
}