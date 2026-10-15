const express = require('express');
const axios = require('axios');
const router = express.Router();

const PRODUCTOS_SERVICE_URL = process.env.PRODUCTOS_SERVICE_URL || 'http://localhost:5001';
const CLIENTES_SERVICE_URL = process.env.CLIENTES_SERVICE_URL || 'http://localhost:5002';
const ORDENES_SERVICE_URL = process.env.ORDENES_SERVICE_URL || 'http://localhost:5003';

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
        headers: { 'X-Gateway': 'CUC-API-Gateway', 'X-Request-Id': req.id || 'agg-req' }
      });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return res.status(404).json({
          gateway: 'CUC-API-Gateway',
          mensaje: `No se encontró la orden con ID: ${id}`
        });
      }
      throw new Error(`Error al consultar ordenes-service: ${err.message}`);
    }

    const orden = respOrden.data.datos;

    // 2. Consultar en paralelo los datos del cliente y los productos
    const clientePromise = axios
      .get(`${CLIENTES_SERVICE_URL}/clientes/${orden.clienteId}`, {
        headers: { 'X-Gateway': 'CUC-API-Gateway' }
      })
      .then((r) => r.data.datos)
      .catch((err) => ({
        error: 'No se pudo cargar información del cliente',
        detalle: err.message
      }));

    const productosPromises = orden.items.map((item) =>
      axios
        .get(`${PRODUCTOS_SERVICE_URL}/productos/${item.productoId}`, {
          headers: { 'X-Gateway': 'CUC-API-Gateway' }
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
      agregadoPor: 'CUC-API-Gateway',
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
        clientes: 'UP',
        productos: 'UP'
      }
    });
  } catch (error) {
    res.status(502).json({
      gateway: 'CUC-API-Gateway',
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

    res.status(200).json({
      politicaGateway: 'Agregación / Dashboard BFF',
      tiempoEjecucionMs: duracion,
      servicios: {
        productos: {
          estado: prodRes.status === 'fulfilled' ? 'UP' : 'DOWN',
          totalRegistros: prodRes.status === 'fulfilled' ? prodRes.value.data.total : 0
        },
        clientes: {
          estado: cliRes.status === 'fulfilled' ? 'UP' : 'DOWN',
          totalRegistros: cliRes.status === 'fulfilled' ? cliRes.value.data.total : 0
        },
        ordenes: {
          estado: ordRes.status === 'fulfilled' ? 'UP' : 'DOWN',
          totalRegistros: ordRes.status === 'fulfilled' ? ordRes.value.data.total : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      gateway: 'CUC-API-Gateway',
      mensaje: 'Error al generar agregación de dashboard',
      error: error.message
    });
  }
});

module.exports = router;
