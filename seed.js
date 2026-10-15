const mongoose = require('mongoose');

const MONGODB_HOST = '127.0.0.1:27017';

// Schemas mínimos para el seed
const ProductoSchema = new mongoose.Schema({
  nombre: String,
  descripcion: String,
  precio: Number,
  stock: Number,
  categoria: String,
  activo: Boolean
}, { timestamps: true });

const ClienteSchema = new mongoose.Schema({
  identificacion: String,
  nombre: String,
  correo: String,
  telefono: String,
  direccion: String,
  activo: Boolean
}, { timestamps: true });

async function seed() {
  console.log('--- Iniciando siembra de datos de prueba en MongoDB ---');

  // 1. Sembrar Productos
  const prodConn = await mongoose.createConnection(`mongodb://${MONGODB_HOST}/cuc_productos_db`).asPromise();
  const Producto = prodConn.model('Producto', ProductoSchema);
  await Producto.deleteMany({});

  const productos = await Producto.insertMany([
    {
      nombre: 'Laptop ASUS ZenBook 14',
      descripcion: 'Intel Core i7 16GB RAM 512GB SSD OLED',
      precio: 850,
      stock: 15,
      categoria: 'Computadoras',
      activo: true
    },
    {
      nombre: 'Teclado Mecánico Redragon Kumara',
      descripcion: 'RGB Switch Blue formato TKL compacto',
      precio: 45,
      stock: 30,
      categoria: 'Periféricos',
      activo: true
    },
    {
      nombre: 'Mouse Logitech MX Master 3S',
      descripcion: 'Inalámbrico ergonomía avanzada 8000 DPI',
      precio: 99,
      stock: 20,
      categoria: 'Periféricos',
      activo: true
    },
    {
      nombre: 'Monitor Dell UltraSharp 27"',
      descripcion: 'Resolución 4K IPS USB-C 60Hz',
      precio: 420,
      stock: 8,
      categoria: 'Monitores',
      activo: true
    }
  ]);
  console.log(`✅ [cuc_productos_db] Insertados ${productos.length} productos de prueba.`);
  await prodConn.close();

  // 2. Sembrar Clientes
  const cliConn = await mongoose.createConnection(`mongodb://${MONGODB_HOST}/cuc_clientes_db`).asPromise();
  const Cliente = cliConn.model('Cliente', ClienteSchema);
  await Cliente.deleteMany({});

  const clientes = await Cliente.insertMany([
    {
      identificacion: '305550123',
      nombre: 'Ramses Solano',
      correo: 'ramses.solano@est.cuc.ac.cr',
      telefono: '8899-7766',
      direccion: 'Cartago centro, Costa Rica',
      activo: true
    },
    {
      identificacion: '102340567',
      nombre: 'Valeria Castro',
      correo: 'valeria.castro@correo.com',
      telefono: '7011-2233',
      direccion: 'Tres Ríos, La Unión',
      activo: true
    },
    {
      identificacion: '209870654',
      nombre: 'Daniel Mora',
      correo: 'daniel.mora@correo.com',
      telefono: '6044-5566',
      direccion: 'Curridabat, San José',
      activo: true
    }
  ]);
  console.log(`✅ [cuc_clientes_db] Insertados ${clientes.length} clientes de prueba.`);
  await cliConn.close();

  // 3. Limpiar Órdenes para iniciar limpio
  const ordConn = await mongoose.createConnection(`mongodb://${MONGODB_HOST}/cuc_ordenes_db`).asPromise();
  await ordConn.collection('ordens').deleteMany({});
  console.log(`✅ [cuc_ordenes_db] Colección de órdenes inicializada limpia.`);
  await ordConn.close();

  console.log('--- ¡Datos de prueba sembrados exitosamente! ---');
  console.log(`Cliente ID de prueba: ${clientes[0]._id}`);
  console.log(`Producto 1 ID de prueba: ${productos[0]._id} (${productos[0].nombre})`);
  console.log(`Producto 2 ID de prueba: ${productos[1]._id} (${productos[1].nombre})`);
}

seed().catch((err) => {
  console.error('Error durante la siembra de datos:', err);
  process.exit(1);
});
