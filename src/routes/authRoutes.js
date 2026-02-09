const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema, refreshTokenSchema } = require('../validations/authValidation');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.get('/me', authenticate, authController.me);

module.exports = router;
