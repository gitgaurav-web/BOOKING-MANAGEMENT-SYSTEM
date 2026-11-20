import rateLimit from 'express-rate-limit';

// Rate limiter for authentication endpoints (Login & Register)
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 100, // allow up to 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please wait a moment and try again.',
  },
});

// General API rate limiter for write operations if needed
export const apiMutationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 60, // 60 write requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please slow down and try again shortly.',
  },
});

// Global rate limiter for general API endpoints to prevent scraping and DoS
export const globalApiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 300, // 300 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP address. Please slow down and try again shortly.',
  },
});

