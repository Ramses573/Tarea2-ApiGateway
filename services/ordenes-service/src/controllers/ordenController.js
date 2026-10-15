const Orden = require('../models/Orden');
const axios = require('axios');

const PRODUCTOS_SERVICE_URL = process.env.PRODUCTOS_SERVICE_URL || 'http://localhost:5001';
const CLIENTES_SERVICE_URL = process.env.CLIENTES_SERVICE_URL || 'http://localhost:5002';

// Obtener todas las órdenes
exports.obtenerOrdenes = async (req, res) => {
  try {
    const { estado, clienteId } = req.query;
    const filtro = {};

    if (estado) filtro.estado = estado.toUpperCase();
    if (clienteId) filtro.clienteId = clienteId;

    const ordenes = await Orden.find(filtro).sort({ createdAt: -1 });
    res.status(200).json({
      servicio: 'ordenes-service',
      total: ordenes.length,
      datos: ordenes
    });
  } catch (error) {
    res.status(500).json({
      servicio: 'ordenes-service',
      mensaje: 'Error al obtener órdenes',
      error: error.message
    });
  }
};

// Obtener orden por ID
exports.obtenerOrdenPorId = async (req, res) => {
  try {
    const orden = await Orden.findById(req.params.id);
    if (!orden) {
      return res.status(404).json({
        servicio: 'ordenes-service',
        mensaje: `Orden con ID ${req.params.id} no encontrada`
      });
    }

    res.status(200).json({
      servicio: 'ordenes-service',
      datos: orden
    });
  } catch (error) {
    res.status(500).json({
      servicio: 'ordenes-service',
      mensaje: 'Error al buscar orden',
      error: error.message
    });
  }
};

// Crear nueva orden con comunicación inter-servicio
exports.crearOrden = async (req, res) => {
  try {
    const { clienteId, items, notas } = req.body;

    if (!clienteId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        servicio: 'ordenes-service',
        mensaje: 'Se requiere clienteId y al menos un item en la orden'
      });
    }

    // 1. Comunicación inter-servicio: Validar cliente
    console.log(`[ORDENES-SERVICE] Validando existencia de cliente ${clienteId} en ${CLIENTES_SERVICE_URL}...`);
    let clienteData;
    try {
      const respCliente = await axios.get(`${CLIENTES_SERVICE_URL}/clientes/${clienteId}`, {
        headers: { 'X-Request-Source': 'ordenes-service' }
      });
      clienteData = respCliente.data.datos;
    } catch (err) {
      const status = err.response ? err.response.status : 503;
      return res.status(status).json({
        servicio: 'ordenes-service',
        mensaje: `Fallo en comunicación inter-servicio: No se pudo verificar el cliente ${clienteId}`,
        detalle: err.response ? err.response.data : err.message
      });
    }

    // 2. Comunicación inter-servicio: Validar cada producto y su stock
    const itemsProcesados = [];
    let granTotal = 0;

    for (const item of items) {
      const { productoId, cantidad } = item;

      if (!productoId || !cantidad || cantidad <= 0) {
        return res.status(400).json({
          servicio: 'ordenes-service',
          mensaje: 'Cada item debe tener productoId válido y cantidad mayor a 0'
        });
      }

      console.log(`[ORDENES-SERVICE] Verificando producto ${productoId} en ${PRODUCTOS_SERVICE_URL}...`);
      let productoData;
      try {
        const respProd = await axios.get(`${PRODUCTOS_SERVICE_URL}/productos/${productoId}`, {
          headers: { 'X-Request-Source': 'ordenes-service' }
        });
        productoData = respProd.data.datos;
      } catch (err) {
        const status = err.response ? err.response.status : 503;
        return res.status(status).json({
          servicio: 'ordenes-service',
          mensaje: `Fallo en comunicación inter-servicio: Producto ${productoId} no encontrado o inalcanzable`,
          detalle: err.response ? err.response.data : err.message
        });
      }

      // Validar stock disponible
      if (productoData.stock < cantidad) {
        return res.status(400).json({
          servicio: 'ordenes-service',
          mensaje: `Stock insuficiente para producto '${productoData.nombre}'. Disponible: ${productoData.stock}, Solicitado: ${cantidad}`
        });
      }

      // Descontar stock mediante llamada inter-servicio
      try {
        await axios.patch(
          `${PRODUCTOS_SERVICE_URL}/productos/${productoId}/descontar-stock`,
          { cantidad },
          { headers: { 'X-Request-Source': 'ordenes-service' } }
        );
      } catch (err) {
        return res.status(500).json({
          servicio: 'ordenes-service',
          mensaje: `Error al descontar stock para el producto ${productoId}`,
          detalle: err.response ? err.response.data : err.message
        });
      }

      const subtotal = productoData.precio * cantidad;
      granTotal += subtotal;

      itemsProcesados.push({
        productoId: productoData._id.toString(),
        nombreProducto: productoData.nombre,
        cantidad,
        precioUnitario: productoData.precio,
        subtotal
      });
    }

    // 3. Guardar orden en BD NoSQL
    const nuevaOrden = new Orden({
      clienteId,
      items: itemsProcesados,
      total: granTotal,
      estado: 'PENDIENTE',
      notas: notas || ''
    });

    const ordenGuardada = await nuevaOrden.save();

    res.status(201).json({
      servicio: 'ordenes-service',
      mensaje: 'Orden creada exitosamente con validación inter-servicio',
      interServicios: {
        clienteValidado: clienteData.nombre,
        productosValidados: itemsProcesados.length
      },
      datos: ordenGuardada
    });
  } catch (error) {
    res.status(500).json({
      servicio: 'ordenes-service',
      mensaje: 'Error general al crear la orden',
      error: error.message
    });
  }
};

// Actualizar estado de orden
exports.actualizarEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    const estadosValidos = ['PENDIENTE', 'PAGADA', 'ENVIADA', 'CANCELADA'];

    if (!estado || !estadosValidos.includes(estado.toUpperCase())) {
      return res.status(400).json({
        servicio: 'ordenes-service',
        mensaje: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`
      });
    }

    const orden = await Orden.findByIdAndUpdate(
      req.params.id,
      { estado: estado.toUpperCase() },
      { new: true }
    );

    if (!orden) {
      return res.status(404).json({
        servicio: 'ordenes-service',
        mensaje: `Orden con ID ${req.params.id} no encontrada`
      });
    }

    res.status(200).json({
      servicio: 'ordenes-service',
      mensaje: `Estado de la orden actualizado a ${estado.toUpperCase()}`,
      datos: orden
    });
  } catch (error) {
    res.status(500).json({
      servicio: 'ordenes-service',
      mensaje: 'Error al actualizar estado de la orden',
      error: error.message
    });
  }
};

// Cancelar orden
exports.cancelarOrden = async (req, res) => {
  try {
    const orden = await Orden.findByIdAndUpdate(
      req.params.id,
      { estado: 'CANCELADA' },
      { new: true }
    );

    if (!orden) {
      return res.status(404).json({
        servicio: 'ordenes-service',
        mensaje: `Orden con ID ${req.params.id} no encontrada`
      });
    }

    res.status(200).json({
      servicio: 'ordenes-service',
      mensaje: 'Orden cancelada exitosamente',
      datos: orden
    });
  } catch (error) {
    res.status(500).json({
      servicio: 'ordenes-service',
      mensaje: 'Error al cancelar la orden',
      error: error.message
    });
  }
};
