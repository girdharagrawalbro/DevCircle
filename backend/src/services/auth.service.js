import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const throwError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
};

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};

export const registerUser = async ({ name, username, email, password }) => {
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    const isEmail = existingUser.email === email;
    throwError(409, isEmail ? 'Email already in use' : 'Username already taken');
  }

  const user = await User.create({ name: name || '', username, email, passwordHash: password });
  const { accessToken, refreshToken } = generateTokens(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const safeUser = user.toJSON();
  delete safeUser.passwordHash;
  delete safeUser.refreshToken;

  return { accessToken, refreshToken, user: safeUser };
};

export const loginUser = async ({ identifier, password }) => {
  const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] }).select('+passwordHash +refreshToken');
  if (!user || !(await user.comparePassword(password))) {
    throwError(401, 'Invalid email/username or password');
  }

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const safeUser = user.toJSON();
  delete safeUser.passwordHash;
  delete safeUser.refreshToken;

  return { accessToken, refreshToken, user: safeUser };
};

export const logoutUser = async (token) => {
  if (token) {
    await User.findOneAndUpdate({ refreshToken: token }, { refreshToken: '' });
  }
};

export const refreshUserToken = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throwError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    throwError(401, 'Invalid refresh token');
  }

  const tokens = generateTokens(user._id);
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  return tokens;
};
