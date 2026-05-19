const mongoose = require('mongoose');
const path     = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');

const NEW_USER = {
  name:     'Finance',
  email:    'finance@energywatch.com',
  password: 'Finance@2026',
  role:     'admin',
};

async function update() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Update] Connected to MongoDB');

    // On cherche l'utilisateur pour le mettre à jour
    let user = await User.findOne({ email: /finance@energywatch/i });
    
    if (user) {
      user.name = NEW_USER.name;
      user.email = NEW_USER.email;
      user.password = NEW_USER.password; // Le modèle User hash le mot de passe automatiquement via pre-save
      await user.save();
      console.log(`[Update] User updated: ${NEW_USER.email} / ${NEW_USER.password}`);
    } else {
      const existsNew = await User.findOne({ email: NEW_USER.email });
      if (!existsNew) {
        await User.create(NEW_USER);
        console.log(`[Update] User created: ${NEW_USER.email} / ${NEW_USER.password}`);
      } else {
        existsNew.password = NEW_USER.password;
        await existsNew.save();
        console.log(`[Update] Password updated for existing user: ${NEW_USER.email}`);
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Update] Error:', err.message);
    process.exit(1);
  }
}

update();
