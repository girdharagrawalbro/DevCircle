import 'dotenv/config.js';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import https from 'https';

import connectDB from './config/db.js';
import initSocket from './services/socket.service.js';
import errorHandler from './middlewares/errorHandler.js';
import notFound from './middlewares/notFound.js';
import rateLimiter from './middlewares/rateLimiter.js';

import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import postsRoutes from './routes/posts.routes.js';
import questionsRoutes from './routes/questions.routes.js';
import aiRoutes from './routes/ai.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import searchRoutes from './routes/search.routes.js';
import messagesRoutes from './routes/messages.routes.js';

const app = express();
const server = http.createServer(app);

// socket
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

initSocket(io);
app.set('io', io);

// middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  if (req.headers) req.headers = mongoSanitize.sanitize(req.headers);
  if (req.query) {
    Object.defineProperty(req, 'query', {
      value: mongoSanitize.sanitize(req.query),
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
  next();
});

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 1000 }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// for fallback storage
app.use('/uploads', express.static(path.join(import.meta.dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'DevCircle API is running', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/messages', messagesRoutes);

app.use(notFound);
app.use(errorHandler);

const PUBLIC_URL = process.env.PUBLIC_URL;
if (PUBLIC_URL) {
  const pingInterval = 14 * 60 * 1000;
  setInterval(() => {
    https.get(`${PUBLIC_URL}/api/health`, (res) => {
      console.log(`Self-ping status: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error('Self-ping error:', err.message);
    });
  }, pingInterval);
}

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on PORT:${PORT}`);
  });
};

start();
