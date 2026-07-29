import * as authService from '../services/auth.service.js';

const register = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;

    const { accessToken, refreshToken, user } = await authService.registerUser({ name, username, email, password });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ success: true, accessToken, user });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const identifier = req.body.email || req.body.identifier;
    const { password } = req.body;
    const { accessToken, refreshToken, user } = await authService.loginUser({ identifier, password });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, accessToken, user });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    await authService.logoutUser(token);

    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }

    const tokens = await authService.refreshUserToken(token);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, accessToken: tokens.accessToken });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

export {
  register,
  login,
  logout,
  refreshToken,
  getMe,
};
