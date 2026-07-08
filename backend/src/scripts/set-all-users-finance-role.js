const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');

async function updateRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Roles] Connected to MongoDB');

    const result = await User.updateMany(
      {},
      { $set: { role: 'responsable_financier' } },
      { runValidators: true }
    );

    console.log(`[Roles] Users updated: ${result.modifiedCount}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Roles] Error:', err.message);
    process.exit(1);
  }
}

updateRoles();
