const Producto = require('../models/Producto');

const SERVICIO = 'productos-service';

// Obtener todos los productos
exports.obtenerProductos = async (req, res) => {
  try {
    const { categoria, activo } = req.query;
    const filtro = {};

    if (categoria) filtro.categoria = new RegExp(categoria, 'i');
    if (activo !== undefined) filtro.activo = activo === 'true';

    const productos = await Producto.find(filtro).sort({ createdAt: -1 });
    res.status(200).json({
      servicio: SERVICIO,
      total: productos.length,
      datos: productos
    });
  } catch (error) {
    res.status(500).json({
      servicio: SERVICIO,
      mensaje: 'Error al obtener productos',
      error: error.message
    });
  }
};

// Obtener producto por ID
exports.obtenerProductoPorId = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({
        servicio: SERVICIO,
        mensaje: `Producto con ID ${req.params.id} no encontrado`
      });
    }

    res.status(200).json({
      servicio: SERVICIO,
      datos: producto
    });
  } catch (error) {
    res.status(500).json({
      servicio: SERVICIO,
      mensaje: 'Error al buscar producto',
      error: error.message
    });
  }
};

// Crear nuevo producto
exports.crearProducto = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoria } = req.body;

    if (!nombre || precio === undefined || stock === undefined) {
      return res.status(400).json({
        servicio: SERVICIO,
        mensaje: 'Campos obligatorios faltantes: nombre, precio y stock son requeridos'
      });
    }

    const nuevoProducto = new Producto({
      nombre,
      descripcion,
      precio,
      stock,
      categoria
    });

    const guardado = await nuevoProducto.save();
    res.status(201).json({
      servicio: SERVICIO,
      mensaje: 'Producto creado exitosamente',
      datos: guardado
    });
  } catch (error) {
    res.status(400).json({
      servicio: SERVICIO,
      mensaje: 'Error al crear producto',
      error: error.message
    });
  }
};

// Actualizar producto
exports.actualizarProducto = async (req, res) => {
  try {
    const productoActualizado = await Producto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!productoActualizado) {
      return res.status(404).json({
        servicio: SERVICIO,
        mensaje: `Producto con ID ${req.params.id} no encontrado`
      });
    }

    res.status(200).json({
      servicio: SERVICIO,
      mensaje: 'Producto actualizado exitosamente',
      datos: productoActualizado
    });
  } catch (error) {
    res.status(400).json({
      servicio: SERVICIO,
      mensaje: 'Error al actualizar producto',
      error: error.message
    });
  }
};

// Eliminar producto
exports.eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    if (!producto) {
      return res.status(404).json({
        servicio: SERVICIO,
        mensaje: `Producto con ID ${req.params.id} no encontrado`
      });
    }

    res.status(200).json({
      servicio: SERVICIO,
      mensaje: 'Producto eliminado correctamente',
      datos: producto
    });
  } catch (error) {
    res.status(500).json({
      servicio: SERVICIO,
      mensaje: 'Error al eliminar producto',
      error: error.message
    });
  }
};

// Validar una cantidad entera positiva enviada en el cuerpo de la solicitud
const cantidadValida = (cantidad) => Number.isInteger(cantidad) && cantidad > 0;

// Descontar stock (usado por microservicio de órdenes).
// La condición "stock >= cantidad" va dentro de la misma operación atómica,
// así dos órdenes simultáneas no pueden dejar el stock en negativo.
exports.descontarStock = async (req, res) => {
  try {
    const { cantidad } = req.body;
    if (!cantidadValida(cantidad)) {
      return res.status(400).json({
        servicio: SERVICIO,
        mensaje: 'La cantidad a descontar debe ser un entero positivo'
      });
    }

    const producto = await Producto.findOneAndUpdate(
      { _id: req.params.id, stock: { $gte: cantidad } },
      { $inc: { stock: -cantidad } },
      { new: true }
    );

    if (!producto) {
      const existe = await Producto.exists({ _id: req.params.id });
      if (!existe) {
        return res.status(404).json({
          servicio: SERVICIO,
          mensaje: `Producto con ID ${req.params.id} no encontrado`
        });
      }
      const actual = await Producto.findById(req.params.id);
      return res.status(400).json({
        servicio: SERVICIO,
        mensaje: `Stock insuficiente para ${actual.nombre}. Disponible: ${actual.stock}, Solicitado: ${cantidad}`
      });
    }

    res.status(200).json({
      servicio: SERVICIO,
      mensaje: 'Stock descontado tras la reserva',
      stockRestante: producto.stock,
      datos: producto
    });
  } catch (error) {
    res.status(500).json({
      servicio: SERVICIO,
      mensaje: 'Error al descontar stock',
      error: error.message
    });
  }
};

// Reponer stock (usado por órdenes para compensar reservas fallidas o cancelaciones)
exports.reponerStock = async (req, res) => {
  try {
    const { cantidad } = req.body;
    if (!cantidadValida(cantidad)) {
      return res.status(400).json({
        servicio: SERVICIO,
        mensaje: 'La cantidad a reponer debe ser un entero positivo'
      });
    }

    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      { $inc: { stock: cantidad } },
      { new: true }
    );

    if (!producto) {
      return res.status(404).json({
        servicio: SERVICIO,
        mensaje: `Producto con ID ${req.params.id} no encontrado`
      });
    }

    res.status(200).json({
      servicio: SERVICIO,
      mensaje: 'Stock repuesto',
      stockRestante: producto.stock,
      datos: producto
    });
  } catch (error) {
    res.status(500).json({
      servicio: SERVICIO,
      mensaje: 'Error al reponer stock',
      error: error.message
    });
  }
};
