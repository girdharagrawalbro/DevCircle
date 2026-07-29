const requestCounts = new Map();

const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; 
  const max = options.max || (process.env.NODE_ENV === 'production' ? 1000 : 10000);
  const message = options.message || 'Too many requests from this IP, please try again later.';

  return (req, res, next) => {

    // bypassing limits for development
    if (process.env.NODE_ENV !== 'production' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1')) {
      return next();
    }

    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    
    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, { count: 1, startTime: now });
      return next();
    }
    
    const record = requestCounts.get(ip);
    
    if (now - record.startTime > windowMs) {
      record.count = 1;
      record.startTime = now;
      return next();
    }
    
    record.count++;
    
    if (record.count > max) {
      return res.status(429).json({ success: false, message });
    }
    
    next();
  };
};

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now - record.startTime > 15 * 60 * 1000) {
      requestCounts.delete(ip);
    }
  }
}, 10 * 60 * 1000);

export default rateLimiter;
