const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');

/**
 * 
 * @param req Request with query containing chat ID and optional limit and offset.
 * If limit and offset are not provided, default limit is 20 and offset is 0.
 * @param res Response with messages in the chat with 
 * specific ID with status 200 or
 * error message with status 400 when chat ID is missing or
 * error message with status 404 when chat is not found or
 * error message with status 500 when an error occurs.
 */
exports.getMessagesByChatId = async (req, res) => {
  try {
    const { chat_id } = req.query;
    if (!chat_id) {
      return res.status(400).send({ error: 'Missing chat_id' });
    }

    const totalMsgNum = await Message.countDocuments({ chatId: chat_id });
    let { limit = 20, offset = 0 } = req.query;
    console.log(chat_id, limit, offset);
    limit = Number(limit);
    offset = Number(offset);
    if (offset > totalMsgNum) {
      return res.status(400).send({ error: 'Offset more than totalMsgNum' });
    }

    const chat = await Chat.findOne({ _id: chat_id });
    if (!chat) {
      return res.status(404).json({ error: 'Chat Not Found' });
    }

    //Sort in descending timestamp order
    const messages = await Message.find({ chatId: chat_id })
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit);

    if (!messages) {
      return res.status(404).json({error: 'no messages found'});
    }

    if (!messages.length) {
      return res.status(200).json({ messages: [] });
    }
    const messageList = await Promise.all(messages.map(async(msg) => {
      const senderId = msg.senderId;
      let receiverId =
        chat.participants.find(participant => participant !== senderId);
      receiverId = receiverId ? receiverId : senderId;
      const sender = await User.findById(senderId);
      const receiver = await User.findById(receiverId);

      return {
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
        msg_id: msg._id,
        content: msg.message,
        timestamp: msg.timestamp,
        status: msg.status
      }
    }));

    res.status(200).json({
      messages: messageList,
      has_more: offset + limit < totalMsgNum,
    });

  } catch (error) {
    console.log('Error retrieving messages', error);
    res.status(500).json({error: 'Server Error with retrieving messages'});
  }
}