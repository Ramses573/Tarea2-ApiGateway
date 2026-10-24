/**
 * Pruebas del microservicio de órdenes.
 * No requieren MongoDB ni los otros servicios: el modelo Orden, axios (llamadas
 * inter-servicio) se reemplazan por dobles en memoria antes de cargar las rutas.
 *
 * Ejecutar desde la raíz del repositorio: npm test
 */
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const SRC = path.join(__dirname, '..', 'src');

// Registra un módulo simulado en la caché de require
function reemplazarModulo(rutaAbsoluta, exportado) {
  const modulo = new Module(rutaAbsoluta);
  modulo.filename = rutaAbsoluta;
  modulo.loaded = true;
  modulo.exports = exportado;
  require.cache[rutaAbsoluta] = modulo;
}

const CLIENTE_ID = '65a000000000000000000001';
const P1 = '65b000000000000000000001';
const P2 = '65b000000000000000000002';

let productos; // id -> producto
let ordenes; // id -> orden
let contador;
let fallos; // { id, accion, status } para simular errores aguas abajo
let llamadas; // registro de reservas y reposiciones

const copia = (objeto) => JSON.parse(JSON.stringify(objeto));

function errorHttp(status) {
  const error = new Error(`HTTP ${status}`);
  error.response = { status, data: { mensaje: 'simulado' } };
  return error;
}

function reiniciarEstado() {
  productos = new Map([
    [P1, { _id: P1, nombre: 'Laptop', precio: 100, stock: 5, activo: true }],
    [P2, { _id: P2, nombre: 'Mouse', precio: 20, stock: 5, activo: true }]
  ]);
  ordenes = new Map();
  contador = 0;
  fallos = [];
  llamadas = [];
}

// --- Doble de axios ---
const axiosSimulado = {
  get: async (url) => {
    let m = url.match(/\/productos\/([a-f0-9]{24})$/);
    if (m) {
      if (!productos.has(m[1])) throw errorHttp(404);
      return { data: { datos: copia(productos.get(m[1])) } };
    }
    m = url.match(/\/clientes\/([a-f0-9]{24})$/);
    if (m) {
      if (m[1] !== CLIENTE_ID) throw errorHttp(404);
      return { data: { datos: { nombre: 'Cliente Prueba' } } };
    }
    throw new Error(`URL no simulada: ${url}`);
  },
  patch: async (url, cuerpo) => {
    const m = url.match(/\/productos\/([a-f0-9]{24})\/(descontar-stock|reponer-stock)$/);
    if (!m) throw new Error(`URL no simulada: ${url}`);
    const [, id, accion] = m;
    llamadas.push({ id, accion, cantidad: cuerpo.cantidad });

    const fallo = fallos.find((f) => f.id === id && f.accion === accion);
    if (fallo) throw errorHttp(fallo.status);

    const producto = productos.get(id);
    if (!producto) throw errorHttp(404);
    if (accion === 'descontar-stock') {
      if (producto.stock < cuerpo.cantidad) throw errorHttp(400);
      producto.stock -= cuerpo.cantidad;
    } else {
      producto.stock += cuerpo.cantidad;
    }
    return { data: {} };
  }
};

// --- Doble del modelo Orden ---
function OrdenSimulada(datos) {
  Object.assign(this, copia(datos));
}
OrdenSimulada.prototype.save = async function () {
  contador += 1;
  this._id = contador.toString(16).padStart(24, '0');
  ordenes.set(this._id, copia(this));
  return copia(this);
};
OrdenSimulada.find = () => ({ sort: async () => [...ordenes.values()].map(copia) });
OrdenSimulada.findById = async (id) => (ordenes.has(id) ? copia(ordenes.get(id)) : null);
OrdenSimulada.findOneAndUpdate = async (filtro, actualizacion) => {
  const doc = ordenes.get(filtro._id);
  if (!doc || !filtro.estado.$in.includes(doc.estado)) return null;
  const anterior = copia(doc);
  Object.assign(doc, actualizacion);
  return anterior;
};
OrdenSimulada.findByIdAndUpdate = async (id, actualizacion) => {
  const doc = ordenes.get(id);
  if (!doc) return null;
  Object.assign(doc, actualizacion);
  return copia(doc);
};

reemplazarModulo(require.resolve('axios', { paths: [SRC] }), axiosSimulado);
reemplazarModulo(require.resolve(path.join(SRC, 'models', 'Orden')), OrdenSimulada);

// Se cargan después de instalar los dobles
const express = require('express');
const ordenRoutes = require(path.join(SRC, 'routes', 'ordenRoutes'));

let servidor;
let base;

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/ordenes', ordenRoutes);
  servidor = app.listen(0);
  await new Promise((resolver) => servidor.once('listening', resolver));
  base = `http://127.0.0.1:${servidor.address().port}/ordenes`;
});

after(() => new Promise((resolver) => servidor.close(resolver)));

beforeEach(reiniciarEstado);

async function http(metodo, ruta, cuerpo) {
  const respuesta = await fetch(base + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });
  return { status: respuesta.status, json: await respuesta.json() };
}

const ordenDePrueba = (items) => ({ clienteId: CLIENTE_ID, items, notas: 'prueba' });

test('crear orden descuenta stock y calcula el total', async () => {
  const r = await http('POST', '', ordenDePrueba([{ productoId: P1, cantidad: 2 }, { productoId: P2, cantidad: 1 }]));

  assert.equal(r.status, 201);
  assert.equal(r.json.datos.total, 220);
  assert.equal(productos.get(P1).stock, 3);
  assert.equal(productos.get(P2).stock, 4);
});

test('crear orden no toca inventario si un producto no tiene stock suficiente', async () => {
  productos.get(P2).stock = 0;

  const r = await http('POST', '', ordenDePrueba([{ productoId: P1, cantidad: 2 }, { productoId: P2, cantidad: 1 }]));

  assert.equal(r.status, 400);
  assert.match(r.json.mensaje, /Stock insuficiente/);
  assert.equal(productos.get(P1).stock, 5, 'el primer producto no debe quedar descontado');
  assert.equal(llamadas.filter((l) => l.accion === 'descontar-stock').length, 0);
  assert.equal(ordenes.size, 0);
});

test('si falla la reserva del segundo producto se repone el primero', async () => {
  fallos.push({ id: P2, accion: 'descontar-stock', status: 503 });

  const r = await http('POST', '', ordenDePrueba([{ productoId: P1, cantidad: 2 }, { productoId: P2, cantidad: 1 }]));

  assert.equal(r.status, 503);
  assert.equal(productos.get(P1).stock, 5, 'el stock del primer producto debe devolverse');
  assert.equal(productos.get(P2).stock, 5);
  assert.ok(llamadas.some((l) => l.id === P1 && l.accion === 'reponer-stock' && l.cantidad === 2));
  assert.equal(ordenes.size, 0);
});

test('cancelar orden devuelve el stock y no se puede cancelar dos veces', async () => {
  const creada = await http('POST', '', ordenDePrueba([{ productoId: P1, cantidad: 2 }]));
  const id = creada.json.datos._id;

  const cancelada = await http('DELETE', `/${id}`);
  assert.equal(cancelada.status, 200);
  assert.equal(cancelada.json.datos.estado, 'CANCELADA');
  assert.equal(productos.get(P1).stock, 5);

  const otraVez = await http('DELETE', `/${id}`);
  assert.equal(otraVez.status, 400);
  assert.equal(productos.get(P1).stock, 5, 'no debe devolver stock dos veces');
});

test('no se puede cancelar una orden ya enviada', async () => {
  const creada = await http('POST', '', ordenDePrueba([{ productoId: P1, cantidad: 2 }]));
  const id = creada.json.datos._id;
  await http('PUT', `/${id}/estado`, { estado: 'ENVIADA' });

  const r = await http('DELETE', `/${id}`);

  assert.equal(r.status, 400);
  assert.equal(productos.get(P1).stock, 3, 'el stock de una orden enviada no se devuelve');
});

test('si falla la reposición al cancelar, la orden queda igual y el stock revertido', async () => {
  const creada = await http('POST', '', ordenDePrueba([{ productoId: P1, cantidad: 2 }, { productoId: P2, cantidad: 1 }]));
  const id = creada.json.datos._id;
  fallos.push({ id: P2, accion: 'reponer-stock', status: 503 });

  const r = await http('DELETE', `/${id}`);

  assert.equal(r.status, 503);
  const orden = await http('GET', `/${id}`);
  assert.equal(orden.json.datos.estado, 'PENDIENTE');
  assert.equal(productos.get(P1).stock, 3, 'lo repuesto antes del fallo debe volver a descontarse');
  assert.equal(productos.get(P2).stock, 4);
});

test('no se puede cambiar a CANCELADA con PUT (debe usar DELETE)', async () => {
  const creada = await http('POST', '', ordenDePrueba([{ productoId: P1, cantidad: 1 }]));
  const r = await http('PUT', `/${creada.json.datos._id}/estado`, { estado: 'CANCELADA' });
  assert.equal(r.status, 400);
});

test('un ID con formato inválido responde 400', async () => {
  const r = await http('GET', '/no-es-un-id');
  assert.equal(r.status, 400);
});

test('cantidades no enteras o cero se rechazan', async () => {
  const r = await http('POST', '', ordenDePrueba([{ productoId: P1, cantidad: 0 }]));
  assert.equal(r.status, 400);
  assert.equal(productos.get(P1).stock, 5);
});
