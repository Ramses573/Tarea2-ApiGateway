const path = require('path');

// El gateway lee su propio .env (ubicado en su carpeta), sin importar desde dónde se ejecute.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  PORT: process.env.PORT || 8080,
  GATEWAY_NAME: process.env.GATEWAY_NAME || 'CUC-API-Gateway',
  PRODUCTOS_SERVICE_URL: process.env.PRODUCTOS_SERVICE_URL || 'http://localhost:5001',
  CLIENTES_SERVICE_URL: process.env.CLIENTES_SERVICE_URL || 'http://localhost:5002',
  ORDENES_SERVICE_URL: process.env.ORDENES_SERVICE_URL || 'http://localhost:5003'
};
