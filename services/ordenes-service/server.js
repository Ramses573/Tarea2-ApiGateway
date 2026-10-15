require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const ordenRoutes = require('./src/routes/ordenRoutes');

const app = express();
const PORT = process.env.PORT || 5003;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cuc_ordenes_db';
const SERVICE_NAME = process.env.SERVICE_NAME || 'Ordenes-Service';

// Middlewares globales
app.use(cors());
app.use(express.json());

// Middleware de observabilidad y logging
app.use((req, res, next) => {
  const inicio = Date.now();
  const requestId = req.headers['x-request-id'] || 'N/A';
  const viaGateway = req.headers['x-gateway'] || 'Directo';

  console.log(`[${SERVICE_NAME}] [${new Date().toISOString()}] [IN] ${req.method} ${req.originalUrl} | ReqId: ${requestId} | Gateway: ${viaGateway}`);

  res.on('finish', () => {
    const duracion = Date.now() - inicio;
    console.log(`[${SERVICE_NAME}] [${new Date().toISOString()}] [OUT] ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Tiempo: ${duracion}ms`);
  });

  next();
});

// Rutas
app.use('/ordenes', ordenRoutes);
app.use('/', ordenRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    servicio: SERVICE_NAME,
    estado: 'UP',
    puerto: PORT,
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas inexistentes
app.use((req, res) => {
  res.status(404).json({
    servicio: SERVICE_NAME,
    mensaje: `Ruta ${req.originalUrl} no encontrada en este microservicio`
  });
});

// Conexión a MongoDB y arranque del servidor
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log(`[${SERVICE_NAME}] Conectado exitosamente a MongoDB (${MONGODB_URI})`);
    app.listen(PORT, () => {
      console.log(`[${SERVICE_NAME}] Microservicio corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(`[${SERVICE_NAME}] Error al conectar con MongoDB:`, err.message);
    process.exit(1);
  });
