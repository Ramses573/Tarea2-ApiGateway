require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const aggregationRoutes = require('./src/routes/aggregationRoutes');

const app = express();
const PORT = process.env.PORT || 8080;
const GATEWAY_NAME = process.env.GATEWAY_NAME || 'CUC-API-Gateway';

const PRODUCTOS_SERVICE_URL = process.env.PRODUCTOS_SERVICE_URL || 'http://localhost:5001';
const CLIENTES_SERVICE_URL = process.env.CLIENTES_SERVICE_URL || 'http://localhost:5002';
const ORDENES_SERVICE_URL = process.env.ORDENES_SERVICE_URL || 'http://localhost:5003';

// Middleware global de CORS
app.use(cors());

// Observabilidad y Logging centralizado del Gateway
app.use((req, res, next) => {
  const inicio = Date.now();
  const requestId = `gw-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  req.id = requestId;

  // Inyección de cabeceras de respuesta del Gateway
  res.setHeader('X-Gateway-Processed-By', GATEWAY_NAME);
  res.setHeader('X-Request-Id', requestId);
  res.removeHeader('X-Powered-By');

  console.log(`[${GATEWAY_NAME}] [${new Date().toISOString()}] [IN] ${req.method} ${req.originalUrl} | ReqId: ${requestId}`);

  res.on('finish', () => {
    const duracion = Date.now() - inicio;
    console.log(`[${GATEWAY_NAME}] [${new Date().toISOString()}] [OUT] ${req.method} ${req.originalUrl} -> HTTP ${res.statusCode} (${duracion}ms)`);
  });

  next();
});

// Health check propio del Gateway y estado de rutas
app.get('/health', (req, res) => {
  res.status(200).json({
    gateway: GATEWAY_NAME,
    estado: 'UP',
    puerto: PORT,
    timestamp: new Date().toISOString(),
    serviciosEnrutados: {
      productos: PRODUCTOS_SERVICE_URL,
      clientes: CLIENTES_SERVICE_URL,
      ordenes: ORDENES_SERVICE_URL
    }
  });
});

/**
 * POLÍTICA DE AGREGACIÓN (API Composition / BFF):
 * Se monta antes del proxy para que las rutas agregadas (/api/resumen-orden, /api/dashboard)
 * sean procesadas internamente por el Gateway en lugar de reenviarse crudas.
 */
app.use('/api', aggregationRoutes);

/**
 * POLÍTICA DE TRANSFORMACIÓN DE ENCABEZADOS Y RUTAS:
 * Se aplican headers de trazabilidad y reescritura de ruta (/api/productos -> /productos).
 */
const crearProxy = (targetUrl, pathPrefix) => {
  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathFilter: `/api/${pathPrefix}`,
    pathRewrite: {
      [`^/api/${pathPrefix}`]: `/${pathPrefix}`
    },
    on: {
      proxyReq: (proxyReq, req, res) => {
        // Política de transformación de cabeceras entrantes hacia el microservicio
        proxyReq.setHeader('X-Gateway', GATEWAY_NAME);
        proxyReq.setHeader('X-Forwarded-Host', req.headers.host || 'localhost');
        proxyReq.setHeader('X-Request-Id', req.id || 'N/A');
        proxyReq.setHeader('X-Gateway-Timestamp', new Date().toISOString());

        console.log(`[${GATEWAY_NAME}] -> Enrutando ${req.method} ${req.originalUrl} a ${targetUrl}/${pathPrefix}`);
      },
      proxyRes: (proxyRes, req, res) => {
        // Transformación de cabeceras de respuesta salientes
        proxyRes.headers['x-gateway-routed'] = 'true';
      },
      error: (err, req, res) => {
        console.error(`[${GATEWAY_NAME}] Error al enrutar hacia ${targetUrl}:`, err.message);
        res.status(503).json({
          gateway: GATEWAY_NAME,
          mensaje: `El microservicio de ${pathPrefix} no se encuentra disponible`,
          error: err.message
        });
      }
    }
  });
};

// Configuración de Routing del Gateway hacia los 3 Microservicios
app.use(crearProxy(PRODUCTOS_SERVICE_URL, 'productos'));
app.use(crearProxy(CLIENTES_SERVICE_URL, 'clientes'));
app.use(crearProxy(ORDENES_SERVICE_URL, 'ordenes'));

// Manejo de rutas desconocidas en el Gateway
app.use((req, res) => {
  res.status(404).json({
    gateway: GATEWAY_NAME,
    mensaje: `Ruta ${req.originalUrl} no configurada en el API Gateway`,
    rutasDisponibles: [
      'GET /health',
      'GET /api/dashboard (Agregación)',
      'GET /api/resumen-orden/:id (Agregación)',
      '/api/productos/*',
      '/api/clientes/*',
      '/api/ordenes/*'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 ${GATEWAY_NAME} corriendo en http://localhost:${PORT}`);
  console.log(`👉 Entrada única para todos los microservicios`);
  console.log(`- Productos: http://localhost:${PORT}/api/productos`);
  console.log(`- Clientes:  http://localhost:${PORT}/api/clientes`);
  console.log(`- Órdenes:   http://localhost:${PORT}/api/ordenes`);
  console.log(`- Resumen:   http://localhost:${PORT}/api/resumen-orden/:id (Agregación)`);
  console.log(`- Dashboard: http://localhost:${PORT}/api/dashboard (Agregación)`);
  console.log(`====================================================`);
});
