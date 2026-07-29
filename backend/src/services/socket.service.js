import User from '../models/User.js';

const initSocket = (io) => {
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join', async (userId) => {
      if (!userId) return;
      socket.join(userId);
      onlineUsers.set(userId, socket.id);

      await User.findByIdAndUpdate(userId, { isOnline: true }).catch(() => {});

      io.emit('user_online', { userId });
      console.log(`User ${userId} joined room`);
    });

    socket.on('typing', ({ to, from }) => {
      io.to(to).emit('typing', { from });
    });

    socket.on('disconnect', async () => {
      let disconnectedUserId = null;
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          onlineUsers.delete(userId);
          break;
        }
      }

      if (disconnectedUserId) {
        await User.findByIdAndUpdate(disconnectedUserId, { isOnline: false }).catch(() => {});
        io.emit('user_offline', { userId: disconnectedUserId });
        console.log(`User ${disconnectedUserId} went offline`);
      }
    });
  });

  return { onlineUsers };
};

export default initSocket;
