const mongoose = require('mongoose');

const ItemOrdenSchema = new mongoose.Schema(
  {
    productoId: {
      type: String,
      required: [true, 'El ID del producto es obligatorio']
    },
    nombreProducto: {
      type: String,
      required: true
    },
    cantidad: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [1, 'La cantidad mínima es 1']
    },
    precioUnitario: {
      type: Number,
      required: [true, 'El precio unitario es obligatorio'],
      min: [0, 'El precio no puede ser negativo']
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'El subtotal no puede ser negativo']
    }
  },
  { _id: false }
);

const OrdenSchema = new mongoose.Schema(
  {
    clienteId: {
      type: String,
      required: [true, 'El ID del cliente es obligatorio']
    },
    items: {
      type: [ItemOrdenSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Una orden debe contener al menos un producto'
      }
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'El total no puede ser negativo']
    },
    estado: {
      type: String,
      enum: ['PENDIENTE', 'PAGADA', 'ENVIADA', 'CANCELADA'],
      default: 'PENDIENTE'
    },
    notas: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model('Orden', OrdenSchema);
