import Message from '../models/Message.js';
import User from '../models/User.js';

const throwError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
};

export const sendMessage = async (senderId, receiverId, content, io) => {
  if (!receiverId || !content) {
    throwError(400, 'Receiver and content are required');
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throwError(404, 'Receiver not found');
  }

  const message = await Message.create({
    sender: senderId,
    receiver: receiverId,
    content,
  });

  await message.populate('sender', 'name username avatar');
  await message.populate('receiver', 'name username avatar');

  io?.to(receiverId.toString()).emit('new_message', message);

  return message;
};

export const getMessages = async (chatUserId, currentUserId) => {
  const messages = await Message.find({
    $or: [
      { sender: currentUserId, receiver: chatUserId },
      { sender: chatUserId, receiver: currentUserId },
    ],
  })
    .sort({ createdAt: 1 })
    .populate('sender', 'name username avatar')
    .populate('receiver', 'name username avatar');

  await Message.updateMany(
    { sender: chatUserId, receiver: currentUserId, read: false },
    { read: true }
  );

  return messages;
};

export const getConversations = async (currentUserId) => {
  const messages = await Message.find({
    $or: [{ sender: currentUserId }, { receiver: currentUserId }],
  })
    .sort({ createdAt: -1 })
    .populate('sender', 'name username avatar bio role isOnline')
    .populate('receiver', 'name username avatar bio role isOnline');

  const conversationMap = new Map();

  for (const msg of messages) {
    const contact = msg.sender._id.toString() === currentUserId.toString() ? msg.receiver : msg.sender;
    const contactId = contact._id.toString();

    if (!conversationMap.has(contactId)) {
      conversationMap.set(contactId, {
        contact,
        lastMessage: msg,
        unreadCount: 0,
      });
    }

    if (msg.receiver._id.toString() === currentUserId.toString() && !msg.read) {
      const convo = conversationMap.get(contactId);
      convo.unreadCount += 1;
    }
  }

  return Array.from(conversationMap.values());
};
