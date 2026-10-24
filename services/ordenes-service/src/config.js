const path = require('path');

// Cada servicio lee su propio .env (ubicado en su carpeta), sin importar desde dónde se ejecute.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  PORT: process.env.PORT || 5003,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cuc_ordenes_db',
  SERVICE_NAME: process.env.SERVICE_NAME || 'Ordenes-Service',
  PRODUCTOS_SERVICE_URL: process.env.PRODUCTOS_SERVICE_URL || 'http://localhost:5001',
  CLIENTES_SERVICE_URL: process.env.CLIENTES_SERVICE_URL || 'http://localhost:5002'
};
