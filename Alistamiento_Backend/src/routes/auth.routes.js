const express = require('express');
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/auth.controller');
const validarToken = require('../middleware/validarToken');
const validate = require('../middleware/validate');
const { loginBodySchema } = require('../validators/auth.validator');

const router = express.Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Intente de nuevo en 15 minutos.' },
});

router.use(authRateLimiter);
router.post('/login', validate(loginBodySchema, 'body'), (req, res) => AuthController.login(req, res));
router.get('/me', validarToken, (req, res, next) => AuthController.me(req, res, next));

module.exports = router;
