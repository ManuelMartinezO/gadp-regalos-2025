const mongoose = require('mongoose');

const jugueteSchema = new mongoose.Schema({
  personal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personal',
    required: true
  },
  descripcion: {
    type: String,
    required: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: 1
  },
  categoria: {
    type: String,
    enum: ['niño', 'niña', 'bebe'],
    required: true
  },
  fecha_entrega: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Juguete', jugueteSchema);