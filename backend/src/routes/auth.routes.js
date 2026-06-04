const express = require('express');
const router  = express.Router();
const passport = require('passport');
const auth    = require('../middleware/auth');
const { login, me, register, forgotPassword, resetPassword, googleCallback } = require('../controllers/auth.controller');

router.post('/login',           login);
router.post('/register',        register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);
router.get('/me',               auth, me);

// Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=google` }),
  googleCallback
);

module.exports = router;
