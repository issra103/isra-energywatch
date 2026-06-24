const mongoose = require('mongoose');

const tariffSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  heure_pleine: { 
    type: Number, 
    required: true, 
    min: [0.001, 'Le tarif heure pleine doit être supérieur à 0'] 
  },
  heure_creuse: { 
    type: Number, 
    required: true, 
    min: [0.001, 'Le tarif heure creuse doit être supérieur à 0'] 
  },
  peak_hours: {
    start: { type: Number, default: 8  },
    end:   { type: Number, default: 22 },
  },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Tariff', tariffSchema);
