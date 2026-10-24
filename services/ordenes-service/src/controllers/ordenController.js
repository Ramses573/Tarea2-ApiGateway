const axios = require('axios');
const Orden = require('../models/Orden');
const { PRODUCTOS_SERVICE_URL, CLIENTES_SERVICE_URL } = require('../config');

const SERVICIO = 'ordenes-service';
const ESTADOS_VALIDOS = ['PENDIENTE', 'PAGADA', 'ENVIADA', 'CANCELADA'];
const ESTADOS_CANCELABLES = ['PENDIENTE', 'PAGADA'];
const ID_REGEX = /^[a-fA-F0-9]{24}$/;
const CABECERAS_INTERNAS = { headers: { 'X-Request-Source': SERVICIO } };

const respuesta = (res, status, cuerpo) => res.status(status).json({ servicio: SERVICIO, ...cuerpo });

// Código HTTP que devolvió un servicio aguas abajo, o 503 si no respondió
const statusUpstream = (err) => (err.response ? err.response.status : 503);
const detalleUpstream = (err) => (err.response ? err.response.data : err.message);

/**
 * Devuelve stock reservado. Un fallo al devolver NO se oculta: el producto y la
 * cantidad quedan listados en la respuesta para corrección manual.
 */
async function devolverStock(reservas) {
  const pendientes = [];
  for (const { productoId, cantidad } of reservas) {
    try {
      await axios.patch(
        `${PRODUCTOS_SERVICE_URL}/productos/${productoId}/reponer-stock`,
        { cantidad },
        CABECERAS_INTERNAS
      );
    } catch (err) {
      console.error(`[${SERVICIO}] No se pudo devolver stock (${cantidad}) del producto ${productoId}: ${err.message}`);
      pendientes.push({ productoId, cantidad });
    }
  }
  return pendientes;
}

/**
 * Descuenta stock de cada producto. Si una reserva falla, devuelve las ya
 * descontadas (compensación) y relanza el error con la lista de pendientes.
 */
async function reservarStock(reservas) {
  const confirmadas = [];
  for (const reserva of reservas) {
    try {
      await axios.patch(
        `${PRODUCTOS_SERVICE_URL}/productos/${reserva.productoId}/descontar-stock`,
        { cantidad: reserva.cantidad },
        CABECERAS_INTERNAS
      );
      confirmadas.push(reserva);
    } catch (err) {
      err.stockPendiente = await devolverStock(confirmadas);
      throw err;
    }
  }
}

// Obtener todas las órdenes
exports.obtenerOrdenes = async (req, res) => {
  try {
    const { estado, clienteId } = req.query;
    const filtro = {};

    if (estado) filtro.estado = estado.toUpperCase();
    if (clienteId) filtro.clienteId = clienteId;

    const ordenes = await Orden.find(filtro).sort({ createdAt: -1 });
    respuesta(res, 200, { total: ordenes.length, datos: ordenes });
  } catch (error) {
    respuesta(res, 500, { mensaje: 'Error al obtener órdenes', error: error.message });
  }
};

// Obtener orden por ID
exports.obtenerOrdenPorId = async (req, res) => {
  try {
    const orden = await Orden.findById(req.params.id);
    if (!orden) {
      return respuesta(res, 404, { mensaje: `Orden con ID ${req.params.id} no encontrada` });
    }
    respuesta(res, 200, { datos: orden });
  } catch (error) {
    respuesta(res, 500, { mensaje: 'Error al buscar orden', error: error.message });
  }
};

// Crear nueva orden con validación inter-servicio y reserva de stock
exports.crearOrden = async (req, res) => {
  try {
    const { clienteId, items, notas } = req.body;

    if (!clienteId || !Array.isArray(items) || items.length === 0) {
      return respuesta(res, 400, { mensaje: 'Se requiere clienteId y al menos un item en la orden' });
    }
    if (!ID_REGEX.test(String(clienteId))) {
      return respuesta(res, 400, { mensaje: `El clienteId '${clienteId}' no tiene un formato válido` });
    }
    const itemValido = (item) =>
      item && ID_REGEX.test(String(item.productoId)) && Number.isInteger(item.cantidad) && item.cantidad > 0;
    if (!items.every(itemValido)) {
      return respuesta(res, 400, {
        mensaje: 'Cada item debe tener un productoId con formato válido y una cantidad entera mayor a 0'
      });
    }

    // 1. Validar cliente
    let clienteData;
    try {
      const respCliente = await axios.get(`${CLIENTES_SERVICE_URL}/clientes/${clienteId}`, CABECERAS_INTERNAS);
      clienteData = respCliente.data.datos;
    } catch (err) {
      return respuesta(res, statusUpstream(err), {
        mensaje: `Fallo en comunicación inter-servicio: No se pudo verificar el cliente ${clienteId}`,
        detalle: detalleUpstream(err)
      });
    }

    // 2. Agrupar cantidades por producto (un mismo producto puede aparecer en varias líneas)
    const cantidadPorProducto = new Map();
    for (const item of items) {
      cantidadPorProducto.set(item.productoId, (cantidadPorProducto.get(item.productoId) || 0) + item.cantidad);
    }

    // 3. Leer todos los productos y validar stock ANTES de tocar inventario
    const productos = new Map();
    for (const productoId of cantidadPorProducto.keys()) {
      try {
        const respProd = await axios.get(`${PRODUCTOS_SERVICE_URL}/productos/${productoId}`, CABECERAS_INTERNAS);
        productos.set(productoId, respProd.data.datos);
      } catch (err) {
        return respuesta(res, statusUpstream(err), {
          mensaje: `Fallo en comunicación inter-servicio: Producto ${productoId} no encontrado o inalcanzable`,
          detalle: detalleUpstream(err)
        });
      }
    }

    for (const [productoId, cantidad] of cantidadPorProducto) {
      const producto = productos.get(productoId);
      if (producto.activo === false) {
        return respuesta(res, 400, { mensaje: `El producto '${producto.nombre}' no está activo` });
      }
      if (producto.stock < cantidad) {
        return respuesta(res, 400, {
          mensaje: `Stock insuficiente para producto '${producto.nombre}'. Disponible: ${producto.stock}, Solicitado: ${cantidad}`
        });
      }
    }

    // 4. Reservar stock; si algo falla, se compensa dentro de reservarStock
    const reservas = [...cantidadPorProducto].map(([productoId, cantidad]) => ({ productoId, cantidad }));
    try {
      await reservarStock(reservas);
    } catch (err) {
      // Un 400 de productos significa que el stock cambió entre la lectura y la reserva
      const status = err.response && err.response.status === 400 ? 409 : statusUpstream(err);
      return respuesta(res, status, {
        mensaje: 'No se pudo reservar el stock de la orden. Se revirtieron las reservas parciales',
        detalle: detalleUpstream(err),
        stockPendiente: err.stockPendiente
      });
    }

    // 5. Guardar la orden; si falla, se devuelve todo el stock reservado
    const itemsProcesados = items.map((item) => {
      const producto = productos.get(item.productoId);
      return {
        productoId: producto._id.toString(),
        nombreProducto: producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: producto.precio,
        subtotal: producto.precio * item.cantidad
      };
    });
    const granTotal = itemsProcesados.reduce((suma, item) => suma + item.subtotal, 0);

    try {
      const ordenGuardada = await new Orden({
        clienteId,
        items: itemsProcesados,
        total: granTotal,
        estado: 'PENDIENTE',
        notas: notas || ''
      }).save();

      respuesta(res, 201, {
        mensaje: 'Orden creada exitosamente con validación inter-servicio',
        interServicios: {
          clienteValidado: clienteData.nombre,
          productosValidados: itemsProcesados.length
        },
        datos: ordenGuardada
      });
    } catch (err) {
      const stockPendiente = await devolverStock(reservas);
      respuesta(res, 500, {
        mensaje: 'Error al guardar la orden. El stock reservado fue devuelto',
        error: err.message,
        stockPendiente
      });
    }
  } catch (error) {
    respuesta(res, 500, { mensaje: 'Error general al crear la orden', error: error.message });
  }
};

// Actualizar estado de orden. La cancelación pasa por DELETE para devolver el stock.
exports.actualizarEstado = async (req, res) => {
  try {
    const nuevoEstado = typeof req.body.estado === 'string' ? req.body.estado.toUpperCase() : '';

    if (!ESTADOS_VALIDOS.includes(nuevoEstado)) {
      return respuesta(res, 400, { mensaje: `Estado inválido. Debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` });
    }
    if (nuevoEstado === 'CANCELADA') {
      return respuesta(res, 400, { mensaje: 'Para cancelar una orden use DELETE /ordenes/:id, que devuelve el stock' });
    }

    const actual = await Orden.findById(req.params.id);
    if (!actual) {
      return respuesta(res, 404, { mensaje: `Orden con ID ${req.params.id} no encontrada` });
    }
    if (actual.estado === 'CANCELADA') {
      return respuesta(res, 400, { mensaje: 'La orden está cancelada y no puede cambiar de estado' });
    }

    const orden = await Orden.findByIdAndUpdate(req.params.id, { estado: nuevoEstado }, { new: true });
    respuesta(res, 200, { mensaje: `Estado de la orden actualizado a ${nuevoEstado}`, datos: orden });
  } catch (error) {
    respuesta(res, 500, { mensaje: 'Error al actualizar estado de la orden', error: error.message });
  }
};

// Cancelar orden: cambia el estado de forma atómica y devuelve el stock
exports.cancelarOrden = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Transición atómica: solo una petición puede cancelar una orden cancelable
    const anterior = await Orden.findOneAndUpdate(
      { _id: id, estado: { $in: ESTADOS_CANCELABLES } },
      { estado: 'CANCELADA' },
      { new: false }
    );

    if (!anterior) {
      const existe = await Orden.findById(id);
      if (!existe) {
        return respuesta(res, 404, { mensaje: `Orden con ID ${id} no encontrada` });
      }
      return respuesta(res, 400, { mensaje: `La orden está ${existe.estado} y no se puede cancelar` });
    }

    // 2. Devolver stock. Si un producto ya no existe (404) se omite; otro error revierte la cancelación.
    const restaurados = [];
    try {
      for (const item of anterior.items) {
        try {
          await axios.patch(
            `${PRODUCTOS_SERVICE_URL}/productos/${item.productoId}/reponer-stock`,
            { cantidad: item.cantidad },
            CABECERAS_INTERNAS
          );
        } catch (err) {
          if (statusUpstream(err) === 404) {
            console.warn(`[${SERVICIO}] Producto ${item.productoId} ya no existe; no se repone stock`);
            continue;
          }
          throw err;
        }
        restaurados.push(item);
      }
    } catch (err) {
      // Revertir: volver a descontar lo ya repuesto y restaurar el estado anterior
      for (const item of restaurados) {
        try {
          await axios.patch(
            `${PRODUCTOS_SERVICE_URL}/productos/${item.productoId}/descontar-stock`,
            { cantidad: item.cantidad },
            CABECERAS_INTERNAS
          );
        } catch (revertErr) {
          console.error(`[${SERVICIO}] No se pudo revertir stock del producto ${item.productoId}: ${revertErr.message}`);
        }
      }
      await Orden.findByIdAndUpdate(id, { estado: anterior.estado });
      return respuesta(res, statusUpstream(err), {
        mensaje: 'No se pudo devolver el stock. La orden no fue cancelada',
        detalle: detalleUpstream(err)
      });
    }

    const cancelada = await Orden.findById(id);
    respuesta(res, 200, { mensaje: 'Orden cancelada exitosamente y stock devuelto', datos: cancelada });
  } catch (error) {
    respuesta(res, 500, { mensaje: 'Error al cancelar la orden', error: error.message });
  }
};
