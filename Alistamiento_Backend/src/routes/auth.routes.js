const express = require('express');
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/auth.controller');
const validarToken = require('../middleware/validarToken');
const validate = require('../middleware/validate');
const { loginBodySchema } = require('../validators/auth.validator');

const router = express.Router();

const RATE_LIMIT_MESSAGE = 'Demasiados intentos. Intenta de nuevo en unos minutos.';

/** Misma clave IP que el keyGenerator por defecto de express-rate-limit v7 (req.ip normalizado). */
const rateLimitIpKey = (req) => req.ip ?? 'unknown';

const loginRateLimitHandler = (req, res, _next, options) => {
  const resetTime = req.rateLimit?.resetTime;
  const retryAfterSeconds = resetTime instanceof Date
    ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
    : Math.ceil(options.windowMs / 1000);

  res.setHeader('Retry-After', String(retryAfterSeconds));
  res.status(options.statusCode).json({
    mensaje: RATE_LIMIT_MESSAGE,
    retryAfter: retryAfterSeconds,
  });
};

const emailLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 3,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: loginRateLimitHandler,
  keyGenerator: (req) => {
    const email = req.body?.email;
    if (typeof email === 'string' && email.trim()) {
      return email.trim().toLowerCase();
    }
    return rateLimitIpKey(req);
  },
});

const ipLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: loginRateLimitHandler,
});

router.post(
  '/login',
  ipLimiter,
  emailLimiter,
  validate(loginBodySchema, 'body'),
  (req, res) => AuthController.login(req, res),
);
router.get('/me', validarToken, (req, res, next) => AuthController.me(req, res, next));

module.exports = router;
