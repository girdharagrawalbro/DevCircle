import Notification from '../models/Notification.js';

export const getNotifications = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const notifications = await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name username avatar');

  const total = await Notification.countDocuments({ recipient: userId });
  const totalPages = Math.ceil(total / limit);
  const unreadCount = await Notification.countDocuments({ recipient: userId, read: false });
  return { notifications, totalPages, page, unreadCount };
};

export const markRead = async (notificationId, userId) => {
  await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { read: true }
  );
};

export const markAllRead = async (userId) => {
  await Notification.updateMany({ recipient: userId, read: false }, { read: true });
};
