const Message = require('../models/Message');

exports.getMessagesByChatId = async (req, res) => {
  try {
    const { chatId } = req.params;

    //sort in ascending timestamp order
    const messages = await Message.find({ chatId }).sort({ timestamp: 1 });

    const messageList = messages ? messages.map(msg => ({
      message_id: msg.id,
      sender_id: msg.senderId,
      content: msg.message,
      timestamp: msg.timestamp,
      status: msg.status
    })) : [];

    const resData = { messages: messageList };

    return res.json(resData);
  } catch (error) {
    console.log('Error retrieving messages', error);
    return res.status(500).json({error: 'Server Error with retrieving messages'});
  }
}