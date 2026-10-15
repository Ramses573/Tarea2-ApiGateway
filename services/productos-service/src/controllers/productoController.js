const Producto = require('../models/Producto');

// Obtener todos los productos
exports.obtenerProductos = async (req, res) => {
  try {
    const { categoria, activo } = req.query;
    const filtro = {};

    if (categoria) filtro.categoria = new RegExp(categoria, 'i');
    if (activo !== undefined) filtro.activo = activo === 'true';

    const productos = await Producto.find(filtro).sort({ createdAt: -1 });
    res.status(200).json({
      servicio: 'productos-service',
      total: productos.length,
      datos: productos
    });
  } catch (error) {
    res.status(500).json({
      servicio: 'productos-service',
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
        servicio: 'productos-service',
        mensaje: `Producto con ID ${req.params.id} no encontrado`
      });
    }

    res.status(200).json({
      servicio: 'productos-service',
      datos: producto
    });
  } catch (error) {
    res.status(500).json({
      servicio: 'productos-service',
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
        servicio: 'productos-service',
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
      servicio: 'productos-service',
      mensaje: 'Producto creado exitosamente',
      datos: guardado
    });
  } catch (error) {
    res.status(400).json({
      servicio: 'productos-service',
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
        servicio: 'productos-service',
        mensaje: `Producto con ID ${req.params.id} no encontrado`
      });
    }

    res.status(200).json({
      servicio: 'productos-service',
      mensaje: 'Producto actualizado exitosamente',
      datos: productoActualizado
    });
  } catch (error) {
    res.status(400).json({
      servicio: 'productos-service',
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
        servicio: 'productos-service',
        mensaje: `Producto con ID ${req.params.id} no encontrado`
      });
    }

    res.status(200).json({
      servicio: 'productos-service',
      mensaje: 'Producto eliminado correctamente',
      datos: producto
    });
  } catch (error) {
    res.status(500).json({
      servicio: 'productos-service',
      mensaje: 'Error al eliminar producto',
      error: error.message
    });
  }
};

// Descontar stock (usado por microservicio de órdenes)
exports.descontarStock = async (req, res) => {
  try {
    const { cantidad } = req.body;
    if (!cantidad || cantidad <= 0) {
      return res.status(400).json({
        servicio: 'productos-service',
        mensaje: 'La cantidad a descontar debe ser un entero positivo'
      });
    }

    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({
        servicio: 'productos-service',
        mensaje: `Producto con ID ${req.params.id} no encontrado`
      });
    }

    if (producto.stock < cantidad) {
      return res.status(400).json({
        servicio: 'productos-service',
        mensaje: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}, Solicitado: ${cantidad}`
      });
    }

    producto.stock -= cantidad;
    await producto.save();

    res.status(200).json({
      servicio: 'productos-service',
      mensaje: 'Stock actualizado tras la orden',
      stockRestante: producto.stock,
      datos: producto
    });
  } catch (error) {
    res.status(500).json({
      servicio: 'productos-service',
      mensaje: 'Error al descontar stock',
      error: error.message
    });
  }
};
