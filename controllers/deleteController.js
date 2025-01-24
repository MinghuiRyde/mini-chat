const Chat = require('../models/Chat');
const Message = require('../models/Message');

exports.deleteChatOrMessage = async (req, res) => {
  try {
    const { type, id } = req.body;
    if (!id) {
      return res.status(404).json({ error: 'id not found' });
    }
    console.log({ type, id });
    switch (type) {
      case 'chat':
        await Chat.deleteOne({ _id: id });
        await Message.deleteMany({ chatId: id });
        break;
      case 'message':
        await Message.deleteOne({ _id: id });
        break;
      default:
        res.status(500).json({ error: 'undefined type' });
    }
    res.status(200).json({ message: 'deletion successful' });
  } catch (error) {
    res.status(500).json({ error: error });
  }
}