const Cliente = require('../models/Cliente');

// Obtener todos los clientes
exports.obtenerClientes = async (req, res) => {
  try {
    const { activo, busqueda } = req.query;
    const filtro = {};

    if (activo !== undefined) filtro.activo = activo === 'true';
    if (busqueda) {
      filtro.$or = [
        { nombre: new RegExp(busqueda, 'i') },
        { identificacion: new RegExp(busqueda, 'i') },
        { correo: new RegExp(busqueda, 'i') }
      ];
    }

    const clientes = await Cliente.find(filtro).sort({ createdAt: -1 });
    res.status(200).json({
      servicio: 'clientes-service',
      total: clientes.length,
      datos: clientes
    });
  } catch (error) {
    res.status(500).json({
      servicio: 'clientes-service',
      mensaje: 'Error al obtener clientes',
      error: error.message
    });
  }
};

// Obtener cliente por ID
exports.obtenerClientePorId = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({
        servicio: 'clientes-service',
        mensaje: `Cliente con ID ${req.params.id} no encontrado`
      });
    }

    res.status(200).json({
      servicio: 'clientes-service',
      datos: cliente
    });
  } catch (error) {
    res.status(500).json({
      servicio: 'clientes-service',
      mensaje: 'Error al buscar cliente',
      error: error.message
    });
  }
};

// Registrar nuevo cliente
exports.crearCliente = async (req, res) => {
  try {
    const { identificacion, nombre, correo, telefono, direccion } = req.body;

    if (!identificacion || !nombre || !correo) {
      return res.status(400).json({
        servicio: 'clientes-service',
        mensaje: 'Campos obligatorios: identificacion, nombre y correo'
      });
    }

    // Verificar si ya existe cliente con esa identificación o correo
    const existente = await Cliente.findOne({
      $or: [{ identificacion }, { correo }]
    });

    if (existente) {
      return res.status(409).json({
        servicio: 'clientes-service',
        mensaje: 'Ya existe un cliente registrado con esa identificación o correo electrónico'
      });
    }

    const nuevoCliente = new Cliente({
      identificacion,
      nombre,
      correo,
      telefono,
      direccion
    });

    const guardado = await nuevoCliente.save();
    res.status(201).json({
      servicio: 'clientes-service',
      mensaje: 'Cliente registrado exitosamente',
      datos: guardado
    });
  } catch (error) {
    res.status(400).json({
      servicio: 'clientes-service',
      mensaje: 'Error al registrar cliente',
      error: error.message
    });
  }
};

// Actualizar cliente
exports.actualizarCliente = async (req, res) => {
  try {
    const clienteActualizado = await Cliente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!clienteActualizado) {
      return res.status(404).json({
        servicio: 'clientes-service',
        mensaje: `Cliente con ID ${req.params.id} no encontrado`
      });
    }

    res.status(200).json({
      servicio: 'clientes-service',
      mensaje: 'Cliente actualizado exitosamente',
      datos: clienteActualizado
    });
  } catch (error) {
    res.status(400).json({
      servicio: 'clientes-service',
      mensaje: 'Error al actualizar cliente',
      error: error.message
    });
  }
};

// Eliminar cliente
exports.eliminarCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndDelete(req.params.id);
    if (!cliente) {
      return res.status(404).json({
        servicio: 'clientes-service',
        mensaje: `Cliente con ID ${req.params.id} no encontrado`
      });
    }

    res.status(200).json({
      servicio: 'clientes-service',
      mensaje: 'Cliente eliminado correctamente',
      datos: cliente
    });
  } catch (error) {
    res.status(500).json({
      servicio: 'clientes-service',
      mensaje: 'Error al eliminar cliente',
      error: error.message
    });
  }
};
