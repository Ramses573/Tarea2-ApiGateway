const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema(
  {
    identificacion: {
      type: String,
      required: [true, 'La identificación (cédula o DNI) es obligatoria'],
      unique: true,
      trim: true
    },
    nombre: {
      type: String,
      required: [true, 'El nombre completo es obligatorio'],
      trim: true
    },
    correo: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Por favor proporcione un correo válido']
    },
    telefono: {
      type: String,
      trim: true,
      default: ''
    },
    direccion: {
      type: String,
      trim: true,
      default: ''
    },
    activo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model('Cliente', ClienteSchema);
