const express = require('express');
const router  = express.Router();
const { login, register, logout, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login',    login);
router.post('/register', register);
router.post('/logout',   authMiddleware, logout);
router.get('/me',        authMiddleware, getMe);

module.exports = router;
