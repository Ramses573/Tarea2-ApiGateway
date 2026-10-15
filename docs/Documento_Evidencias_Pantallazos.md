# COLEGIO UNIVERSITARIO DE CARTAGO
## DEPARTAMENTO DE TECNOLOGÍAS DE LA INFORMACIÓN
### CURSO: PROGRAMACIÓN V

---

# DOCUMENTO DE EVIDENCIAS TÉCNICAS Y PRUEBAS FUNCIONALES (PANTALLAZOS)
**Verificación de Microservicios, Persistencia NoSQL, Entrada Única y Políticas de API Gateway**

**Docente:** Prof. Ing. Gabriel González Solano  
**Integrantes del Equipo:**  
- Héctor Román Arrieta  
- Ramsés Aguilar Monge  
- Alejandro Morales  
- Fabián Espinoza Méndez  
- José Rodolfo Morales Calderón  
**Fecha de Entrega:** 15 de Octubre de 2026  
**Periodo Lectivo:** III Cuatrimestre 2026  

---

## EVIDENCIA 1: Microservicios en Ejecución Concurrente y Persistencia NoSQL (MongoDB)

Demuestra los 3 microservicios corriendo en puertos separados (5001, 5002, 5003), el API Gateway en el puerto 8080 y la conexión activa a bases de datos NoSQL independientes en MongoDB:

```text
> tarea2-api-gateway@1.0.0 dev
> concurrently --kill-others -n "GATEWAY,PRODUCTOS,CLIENTES,ORDENES" ...

[GATEWAY] ====================================================
[GATEWAY] 🚀 CUC-API-Gateway corriendo en http://localhost:8080
[GATEWAY] 👉 Entrada única para todos los microservicios
[GATEWAY] - Productos: http://localhost:8080/api/productos
[GATEWAY] - Clientes:  http://localhost:8080/api/clientes
[GATEWAY] - Órdenes:   http://localhost:8080/api/ordenes
[GATEWAY] - Resumen:   http://localhost:8080/api/resumen-orden/:id (Agregación)
[GATEWAY] - Dashboard: http://localhost:8080/api/dashboard (Agregación)
[GATEWAY] ====================================================
[PRODUCTOS] [Productos-Service] Conectado exitosamente a MongoDB (mongodb://127.0.0.1:27017/cuc_productos_db)
[PRODUCTOS] [Productos-Service] Microservicio corriendo en http://localhost:5001
[CLIENTES]  [Clientes-Service] Conectado exitosamente a MongoDB (mongodb://127.0.0.1:27017/cuc_clientes_db)
[CLIENTES]  [Clientes-Service] Microservicio corriendo en http://localhost:5002
[ORDENES]   [Ordenes-Service] Conectado exitosamente a MongoDB (mongodb://127.0.0.1:27017/cuc_ordenes_db)
[ORDENES]   [Ordenes-Service] Microservicio corriendo en http://localhost:5003
```

---

## EVIDENCIA 2: Entrada Única y Enrutamiento (Routing)

### A. Health Check del API Gateway
- **Petición:** `GET http://localhost:8080/health`
- **Estado:** `200 OK` (4 ms)

```json
{
  "gateway": "CUC-API-Gateway",
  "estado": "UP",
  "puerto": 8080,
  "timestamp": "2026-10-15T21:28:00.276Z",
  "serviciosEnrutados": {
    "productos": "http://localhost:5001",
    "clientes": "http://localhost:5002",
    "ordenes": "http://localhost:5003"
  }
}
```

### B. Consulta de Productos enrutada a través del Gateway
- **Petición:** `GET http://localhost:8080/api/productos`
- **Estado:** `200 OK` (12 ms)

```json
{
  "servicio": "productos-service",
  "total": 4,
  "datos": [
    {
      "_id": "6ad13dac36456ff8818d4057",
      "nombre": "Teclado Mecánico Redragon Kumara",
      "descripcion": "RGB Switch Blue formato TKL compacto",
      "precio": 45,
      "stock": 29,
      "categoria": "Periféricos",
      "activo": true,
      "createdAt": "2026-10-15T20:55:08.563Z"
    }
  ]
}
```

### C. Consulta de Clientes enrutada a través del Gateway
- **Petición:** `GET http://localhost:8080/api/clientes`
- **Estado:** `200 OK` (7 ms)

```json
{
  "servicio": "clientes-service",
  "total": 5,
  "datos": [
    {
      "_id": "6ad13dac36456ff8818d405c",
      "identificacion": "305550123",
      "nombre": "Ramsés Aguilar Monge",
      "correo": "ramses.aguilar@est.cuc.cr",
      "telefono": "8899-7766",
      "direccion": "Cartago centro, Costa Rica",
      "activo": true
    }
  ]
}
```

---

## EVIDENCIA 3: Comunicación Inter-Servicio (Órdenes -> Clientes y Productos)

- **Petición:** `POST http://localhost:8080/api/ordenes`
- **Estado:** `201 Created` (38 ms)
- **Descripción:** El servicio de órdenes consume internamente al microservicio de clientes (5002) para validar identidad y al microservicio de productos (5001) para comprobar existencias y descontar stock:

```json
// Request Body enviado:
{
  "clienteId": "6ad13dac36456ff8818d405c",
  "items": [
    {
      "productoId": "6ad13dac36456ff8818d4057",
      "cantidad": 1
    }
  ],
  "notas": "Orden de prueba del equipo de desarrollo CUC"
}

// Response Body recibido con validación inter-servicio:
{
  "servicio": "ordenes-service",
  "mensaje": "Orden creada exitosamente con validación inter-servicio",
  "interServicios": {
    "clienteValidado": "Ramsés Aguilar Monge",
    "productosValidados": 1
  },
  "datos": {
    "_id": "6ad13db2d31eace2d0746b84",
    "clienteId": "6ad13dac36456ff8818d405c",
    "items": [
      {
        "productoId": "6ad13dac36456ff8818d4057",
        "nombreProducto": "Teclado Mecánico Redragon Kumara",
        "cantidad": 1,
        "precioUnitario": 45,
        "subtotal": 45
      }
    ],
    "total": 45,
    "estado": "PENDIENTE",
    "notas": "Orden de prueba del equipo de desarrollo CUC",
    "createdAt": "2026-10-15T20:55:14.959Z"
  }
}
```

---

## EVIDENCIA 4: Políticas de Agregación de Datos (BFF / API Composition)

- **Petición:** `GET http://localhost:8080/api/resumen-orden/6ad13db2d31eace2d0746b84`
- **Estado:** `200 OK` (8 ms)
- **Descripción:** El Gateway compone en una sola respuesta la orden, los datos del cliente y los detalles enriquecidos de cada producto:

```json
{
  "politicaGateway": "Agregación / API Composition",
  "agregadoPor": "CUC-API-Gateway",
  "tiempoEjecucionMs": 8,
  "ordenId": "6ad13db2d31eace2d0746b84",
  "fechaCreacion": "2026-10-15T20:55:14.959Z",
  "estado": "PENDIENTE",
  "notas": "Orden de prueba del equipo de desarrollo CUC",
  "total": 45,
  "cliente": {
    "_id": "6ad13dac36456ff8818d405c",
    "identificacion": "305550123",
    "nombre": "Ramsés Aguilar Monge",
    "correo": "ramses.aguilar@est.cuc.cr",
    "telefono": "8899-7766",
    "direccion": "Cartago centro, Costa Rica",
    "activo": true
  },
  "items": [
    {
      "productoId": "6ad13dac36456ff8818d4057",
      "nombre": "Teclado Mecánico Redragon Kumara",
      "descripcion": "RGB Switch Blue formato TKL compacto",
      "categoria": "Periféricos",
      "precioUnitario": 45,
      "cantidad": 1,
      "subtotal": 45
    }
  ],
  "resumenServicios": {
    "ordenes": "UP",
    "clientes": "UP",
    "productos": "UP"
  }
}
```

---

## EVIDENCIA 5: Política de Transformación de Cabeceras (Headers)

Inspección de las cabeceras HTTP de respuesta inyectadas por el Gateway:

```text
X-Gateway-Processed-By: CUC-API-Gateway
X-Request-Id: gw-1792099689077-6892
x-gateway-routed: true
Content-Type: application/json; charset=utf-8
Access-Control-Allow-Origin: *
Date: Thu, 15 Oct 2026 21:28:09 GMT
Connection: keep-alive
```

---

## EVIDENCIA 6: Observabilidad Centralizada y Logs con Latencias

Traza completa de solicitudes en consola mostrando el prefijo de servicio, entrada `[IN]`, enrutamiento, salida `[OUT]` y tiempo en milisegundos:

```text
[GATEWAY]   [CUC-API-Gateway]  [2026-10-15T21:28:09.077Z] [IN]  GET /api/resumen-orden/6ad13db2d31eace2d0746b84 | ReqId: gw-1792099689077-6892
[ORDENES]   [Ordenes-Service]  [2026-10-15T21:28:09.078Z] [IN]  GET /ordenes/6ad13db2d31eace2d0746b84 | ReqId: gw-1792099689077-6892 | Gateway: CUC-API-Gateway
[ORDENES]   [Ordenes-Service]  [2026-10-15T21:28:09.081Z] [OUT] GET /ordenes/6ad13db2d31eace2d0746b84 | Status: 200 | Tiempo: 3ms
[CLIENTES]  [Clientes-Service] [2026-10-15T21:28:09.083Z] [IN]  GET /clientes/6ad13dac36456ff8818d405c | Gateway: CUC-API-Gateway
[PRODUCTOS] [Productos-Service] [2026-10-15T21:28:09.083Z] [IN]  GET /productos/6ad13dac36456ff8818d4057 | Gateway: CUC-API-Gateway
[CLIENTES]  [Clientes-Service] [2026-10-15T21:28:09.085Z] [OUT] GET /clientes/6ad13dac36456ff8818d405c | Status: 200 | Tiempo: 2ms
[PRODUCTOS] [Productos-Service] [2026-10-15T21:28:09.085Z] [OUT] GET /productos/6ad13dac36456ff8818d4057 | Status: 200 | Tiempo: 2ms
[GATEWAY]   [CUC-API-Gateway]  [2026-10-15T21:28:09.085Z] [OUT] GET /api/resumen-orden/6ad13db2d31eace2d0746b84 -> HTTP 200 (8ms)
```
