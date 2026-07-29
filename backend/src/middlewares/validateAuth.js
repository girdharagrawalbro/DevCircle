const validateRegister = (req, res, next) => {
  const { name, username, email, password } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
  }

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required' });
  }
  if (username.length < 3 || username.length > 30) {
    return res.status(400).json({ success: false, message: 'Username must be between 3 and 30 characters' });
  }
  const usernameRegex = /^[a-z0-9_]+$/;
  if (!usernameRegex.test(username.toLowerCase())) {
    return res.status(400).json({ success: false, message: 'Username can only contain letters, numbers, and underscores' });
  }

  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
  }

  if (name && name.length > 50) {
    return res.status(400).json({ success: false, message: 'Name must be at most 50 characters long' });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const identifier = req.body.email || req.body.identifier;
  const { password } = req.body;

  if (!identifier) {
    return res.status(400).json({ success: false, message: 'Email or Username is required' });
  }

  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }

  next();
};

export { validateRegister, validateLogin };
