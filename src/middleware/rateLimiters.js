import rateLimit from "express-rate-limit";

const handler = (message) => (req, res) =>
  res.status(429).json({ error: { status: 429, message } });

// General limiter: 100 requests / 15 min per IP on every /api route
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7", // sends RateLimit-* headers
  legacyHeaders: false,
  handler: handler("Too many requests, please try again in 15 minutes."),
});

// Stricter limiter for login: 5 attempts / 15 min per IP (brute-force protection)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: handler("Too many login attempts, please try again in 15 minutes."),
});
