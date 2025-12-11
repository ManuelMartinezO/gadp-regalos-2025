const mongoose = require('mongoose');

const personalSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellido: {
    type: String,
    required: true,
    trim: true
  },
  cedula: {
    type: String,
    required: true,
    unique: true
  },
  telefono: String,
  fecha_registro: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Personal', personalSchema);