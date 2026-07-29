import * as notificationsService from '../services/notifications.service.js';

const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await notificationsService.getNotifications(req.user._id, page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const markRead = async (req, res, next) => {
  try {
    await notificationsService.markRead(req.params.id, req.user._id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await notificationsService.markAllRead(req.user._id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export { getNotifications, markRead, markAllRead };
