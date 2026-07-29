import * as messagesService from '../services/messages.service.js';

const sendMessage = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const message = await messagesService.sendMessage(req.user._id, req.body.receiverId, req.body.content, io);
    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const messages = await messagesService.getMessages(req.params.userId, req.user._id);
    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const conversations = await messagesService.getConversations(req.user._id);
    res.json({ success: true, conversations });
  } catch (error) {
    next(error);
  }
};

export {
  sendMessage,
  getMessages,
  getConversations,
};
