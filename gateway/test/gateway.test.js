/**
 * Pruebas del API Gateway. No requieren microservicios: los destinos apuntan a un
 * puerto cerrado para simular servicios caídos.
 *
 * Ejecutar desde la raíz del repositorio: npm test
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

// Debe definirse antes de cargar la configuración
const DESTINO_CAIDO = 'http://127.0.0.1:1';
process.env.PRODUCTOS_SERVICE_URL = DESTINO_CAIDO;
process.env.CLIENTES_SERVICE_URL = DESTINO_CAIDO;
process.env.ORDENES_SERVICE_URL = DESTINO_CAIDO;

const { createApp } = require('../server');

let servidor;
let base;

before(async () => {
  servidor = createApp().listen(0);
  await new Promise((resolver) => servidor.once('listening', resolver));
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(() => new Promise((resolver) => servidor.close(resolver)));

test('health check responde UP y agrega cabeceras del gateway', async () => {
  const r = await fetch(`${base}/health`);
  const cuerpo = await r.json();

  assert.equal(r.status, 200);
  assert.equal(cuerpo.estado, 'UP');
  assert.equal(r.headers.get('x-gateway-processed-by'), 'CUC-API-Gateway');
  assert.ok(r.headers.get('x-request-id'));
});

test('ruta desconocida responde 404 con rutas disponibles', async () => {
  const r = await fetch(`${base}/no-existe`);
  const cuerpo = await r.json();

  assert.equal(r.status, 404);
  assert.ok(Array.isArray(cuerpo.rutasDisponibles));
});

test('si el microservicio está caído el gateway responde 503 controlado', async () => {
  const r = await fetch(`${base}/api/productos`);
  const cuerpo = await r.json();

  assert.equal(r.status, 503);
  assert.match(cuerpo.mensaje, /productos/);
});

test('el dashboard responde 200 aunque los servicios estén caídos (DOWN por servicio)', async () => {
  const r = await fetch(`${base}/api/dashboard`);
  const cuerpo = await r.json();

  assert.equal(r.status, 200);
  assert.equal(cuerpo.servicios.productos.estado, 'DOWN');
  assert.equal(cuerpo.servicios.clientes.estado, 'DOWN');
  assert.equal(cuerpo.servicios.ordenes.estado, 'DOWN');
});

test('la agregación rechaza IDs con formato inválido con 400', async () => {
  const r = await fetch(`${base}/api/resumen-orden/no-valido`);
  assert.equal(r.status, 400);
});
