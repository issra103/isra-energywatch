const mongoose = require('mongoose');
const path     = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');

const ADMIN = {
  name:     'Finance',
  email:    'finance@energywatch.com',
  password: 'Finance@2026',
  role:     'admin',
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed] Connected to MongoDB');

    const exists = await User.findOne({ email: ADMIN.email });
    if (exists) {
      console.log('[Seed] Admin already exists — skipping');
    } else {
      await User.create(ADMIN);
      console.log(`[Seed] Admin created: ${ADMIN.email} / ${ADMIN.password}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error:', err.message);
    process.exit(1);
  }
}

seed();
