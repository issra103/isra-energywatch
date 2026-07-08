const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email et mot de passe requis.' });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });

    if (!user.active)
      return res.status(403).json({ message: 'Compte désactivé.' });

    const token = signToken(user);

    res.json({
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Aucun utilisateur avec cet email.' });
    }

    // Générer un code à 6 chiffres
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Sauvegarder le code (hashé pour la sécurité) et l'expiration (10 min)
    user.resetPasswordToken = crypto.createHash('sha256').update(resetCode).digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // Afficher le code dans les logs du backend (pour les tests)
    console.log('🔐 CODE DE RÉCUPÉRATION :', resetCode);
    
    // Envoyer l'email (mais ne pas bloquer si l'email échoue)
    const message = `Votre code de récupération Energy SaaS est : ${resetCode}\nCe code est valide pendant 10 minutes.`;
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Récupération de mot de passe - Energy SaaS',
        message,
      });
    } catch (err) {
      // Si l'email échoue, on continue quand même (le code est dans les logs)
      console.log('⚠️ Email non envoyé (mais le code est ci-dessus)');
    }

    res.status(200).json({ message: 'Code envoyé ! Vérifiez les logs du backend ou votre email.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const hashedToken = crypto.createHash('sha256').update(code).digest('hex');

    const user = await User.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Code invalide ou expiré.' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const token = signToken(user);
    res.status(200).json({
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Nom, email et mot de passe requis.' });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });

    const user  = await User.create({ name, email, password, role: 'responsable_financier' });
    const token = signToken(user);

    res.status(201).json({
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.googleCallback = (req, res) => {
  const token = signToken(req.user);
  const user = encodeURIComponent(JSON.stringify({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role
  }));
  
  // Redirection vers le frontend avec le token et les infos user en query params
  res.redirect(`${process.env.FRONTEND_URL}/auth/google/success?token=${token}&user=${user}`);
};
