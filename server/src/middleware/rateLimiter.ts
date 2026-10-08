import rateLimit from 'express-rate-limit';

// Rate limiter for authentication endpoints (Login & Register)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 15, // limit each IP to 15 login/register attempts per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    error: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
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
