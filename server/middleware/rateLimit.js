export function rateLimit({ windowMs = 15 * 60 * 1000, max = 10 } = {}) {
  const failures = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    let entry = failures.get(key);
    if (entry && now - entry.start > windowMs) {
      failures.delete(key);
      entry = undefined;
    }
    if (entry && entry.count >= max) {
      return res
        .status(429)
        .json({ message: 'Trop de tentatives échouées, réessayez dans quelques minutes' });
    }

    res.on('finish', () => {
      if (res.statusCode === 401) {
        const current = failures.get(key) || { start: Date.now(), count: 0 };
        current.count += 1;
        failures.set(key, current);
      } else if (res.statusCode < 400) {
        failures.delete(key);
      }
    });
    next();
  };
}
