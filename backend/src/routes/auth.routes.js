const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const jwt     = require('jsonwebtoken');
const axios   = require('axios');
const https   = require('https');
const User    = require('../models/User');
const { login, me, register, forgotPassword, resetPassword } = require('../controllers/auth.controller');

router.post('/login',           login);
router.post('/register',        register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);
router.get('/me',               auth, me);

// ─── Google OAuth Manuel ───────────────────────────────────────────────────────
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Étape 1 : Rediriger vers Google
router.get('/google', (req, res) => {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID,
    redirect_uri:  'http://localhost:4000/api/auth/google/callback',
    response_type: 'code',
    scope:         'openid email profile',
    access_type:   'offline',
    prompt:        'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// Étape 2 : Callback Google
router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=google`);
  }

  try {
    // Échange le code contre un token
    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri:  'http://localhost:4000/api/auth/google/callback',
        grant_type:    'authorization_code',
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        httpsAgent,
      }
    );

    const { access_token } = tokenRes.data;

    // Récupère le profil Google
    const profileRes = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${access_token}` },
        httpsAgent,
      }
    );

    const { id, email, name } = profileRes.data;

    // Trouve ou crée l'utilisateur
    let user = await User.findOne({ googleId: id });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = id;
        await user.save({ validateBeforeSave: false });
      } else {
        user = await User.create({
          name,
          email,
          googleId: id,
          password: Math.random().toString(36).slice(-12) + 'Aa1!',
          role: 'viewer',
          active: true,
        });
      }
    }

    // Génère le JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const userInfo = encodeURIComponent(JSON.stringify({
      id:    user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    }));

    res.redirect(`${process.env.FRONTEND_URL}/auth/google/success?token=${token}&user=${userInfo}`);

  } catch (err) {
    console.error('[Google OAuth] Erreur:', err.response?.data || err.message);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google`);
  }
});

module.exports = router;
