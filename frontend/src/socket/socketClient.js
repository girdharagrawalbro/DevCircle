import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (userId) => {
  if (socket) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    withCredentials: true,
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('socket connected:', socket.id);
    socket.emit('join', userId);
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected');
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};