const express = require('express');
const axios = require('axios');
const { GATEWAY_NAME, PRODUCTOS_SERVICE_URL, CLIENTES_SERVICE_URL, ORDENES_SERVICE_URL } = require('../config');

const router = express.Router();

// Un ID con formato inválido es un error del cliente (400)
router.param('id', (req, res, next, id) => {
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    return res.status(400).json({
      gateway: GATEWAY_NAME,
      mensaje: `El ID '${id}' no tiene un formato válido`
    });
  }
  next();
});

/**
 * POLÍTICA DE AGREGACIÓN #1:
 * Endpoint que unifica la Orden con los datos completos del Cliente y el detalle de cada Producto.
 * Patrón: API Composition / Aggregator / Backend for Frontend (BFF).
 * Ruta en Gateway: GET /api/resumen-orden/:id
 */
router.get('/resumen-orden/:id', async (req, res) => {
  const inicio = Date.now();
  const { id } = req.params;

  try {
    // 1. Obtener la orden desde el microservicio de órdenes
    let respOrden;
    try {
      respOrden = await axios.get(`${ORDENES_SERVICE_URL}/ordenes/${id}`, {
        headers: { 'X-Gateway': GATEWAY_NAME, 'X-Request-Id': req.id || 'agg-req' }
      });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return res.status(404).json({
          gateway: GATEWAY_NAME,
          mensaje: `No se encontró la orden con ID: ${id}`
        });
      }
      throw new Error(`Error al consultar ordenes-service: ${err.message}`);
    }

    const orden = respOrden.data.datos;

    // 2. Consultar en paralelo los datos del cliente y los productos.
    // Si un servicio falla, la agregación responde con datos parciales en vez de fallar completa.
    const clientePromise = axios
      .get(`${CLIENTES_SERVICE_URL}/clientes/${orden.clienteId}`, {
        headers: { 'X-Gateway': GATEWAY_NAME }
      })
      .then((r) => r.data.datos)
      .catch((err) => ({
        error: 'No se pudo cargar información del cliente',
        detalle: err.message
      }));

    const productosPromises = orden.items.map((item) =>
      axios
        .get(`${PRODUCTOS_SERVICE_URL}/productos/${item.productoId}`, {
          headers: { 'X-Gateway': GATEWAY_NAME }
        })
        .then((r) => ({
          productoId: item.productoId,
          nombre: r.data.datos.nombre,
          descripcion: r.data.datos.descripcion,
          categoria: r.data.datos.categoria,
          precioUnitario: item.precioUnitario,
          cantidad: item.cantidad,
          subtotal: item.subtotal
        }))
        .catch(() => ({
          productoId: item.productoId,
          nombre: item.nombreProducto || 'Desconocido',
          precioUnitario: item.precioUnitario,
          cantidad: item.cantidad,
          subtotal: item.subtotal
        }))
    );

    const [cliente, itemsEnriquecidos] = await Promise.all([
      clientePromise,
      Promise.all(productosPromises)
    ]);

    const duracion = Date.now() - inicio;

    // 3. Devolver la respuesta agregada compuesta
    res.status(200).json({
      politicaGateway: 'Agregación / API Composition',
      agregadoPor: GATEWAY_NAME,
      tiempoEjecucionMs: duracion,
      ordenId: orden._id,
      fechaCreacion: orden.createdAt,
      estado: orden.estado,
      notas: orden.notas,
      total: orden.total,
      cliente: cliente,
      items: itemsEnriquecidos,
      resumenServicios: {
        ordenes: 'UP',
        clientes: cliente.error ? 'DEGRADADO' : 'UP',
        productos: itemsEnriquecidos.some((i) => i.nombre === 'Desconocido') ? 'DEGRADADO' : 'UP'
      }
    });
  } catch (error) {
    res.status(502).json({
      gateway: GATEWAY_NAME,
      mensaje: 'Fallo al agregar datos de los microservicios aguas abajo',
      error: error.message
    });
  }
});

/**
 * POLÍTICA DE AGREGACIÓN #2:
 * Dashboard del sistema: consulta el conteo y estado de los 3 microservicios simultáneamente.
 * Ruta en Gateway: GET /api/dashboard
 */
router.get('/dashboard', async (req, res) => {
  const inicio = Date.now();

  try {
    const [prodRes, cliRes, ordRes] = await Promise.allSettled([
      axios.get(`${PRODUCTOS_SERVICE_URL}/productos`),
      axios.get(`${CLIENTES_SERVICE_URL}/clientes`),
      axios.get(`${ORDENES_SERVICE_URL}/ordenes`)
    ]);

    const duracion = Date.now() - inicio;
    const resumen = (resultado) => ({
      estado: resultado.status === 'fulfilled' ? 'UP' : 'DOWN',
      totalRegistros: resultado.status === 'fulfilled' ? resultado.value.data.total : 0
    });

    res.status(200).json({
      politicaGateway: 'Agregación / Dashboard BFF',
      tiempoEjecucionMs: duracion,
      servicios: {
        productos: resumen(prodRes),
        clientes: resumen(cliRes),
        ordenes: resumen(ordRes)
      }
    });
  } catch (error) {
    res.status(500).json({
      gateway: GATEWAY_NAME,
      mensaje: 'Error al generar agregación de dashboard',
      error: error.message
    });
  }
});

module.exports = router;
