const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { login, me, register, forgotPassword, resetPassword } = require('../controllers/auth.controller');

router.post('/login',           login);
router.post('/register',        register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);
router.get('/me',               auth, me);

module.exports = router;
