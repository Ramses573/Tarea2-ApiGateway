# GUÍA PASO A PASO PARA LA GRABACIÓN DEL VIDEO DEMOSTRATIVO (MÍNIMO 5 MINUTOS)
## Tarea Corta 2: API Gateway y Microservicios - Programación V (CUC)

---

## 🎯 OBJETIVO DEL VIDEO
Cumplir con el requerimiento de evidencias de funcionamiento exigido en la pauta:
1. Demostrar los microservicios en ejecución independiente.
2. Demostrar el API Gateway en ejecución como punto de entrada único.
3. Ejecutar pruebas funcionales en Postman de las distintas operaciones (CRUD, comunicación inter-servicio y políticas del Gateway).
4. Mostrar los logs en consola que evidencian la observabilidad y el enrutamiento.

---

## ⏱️ GUIÓN CRONOMETRADO (5 MINUTOS Y 30 SEGUNDOS)

### Minuto 0:00 a 0:45 | Introducción y Explicación de la Arquitectura
* **Qué mostrar en pantalla:** Abre el archivo `README.md` o el diagrama de arquitectura en VS Code.
* **Qué decir:**
  > *"Saludos profesor. Mi nombre es Ramses Solano y esta es la presentación práctica de la Tarea Corta 2 de Programación V sobre API Gateways y Microservicios.*  
  > *Nuestra arquitectura consta de 3 microservicios independientes:*
  > *1. Microservicio de Productos corriendo en el puerto 5001 con su propia base de datos MongoDB `cuc_productos_db`.*
  > *2. Microservicio de Clientes en el puerto 5002 con base de datos `cuc_clientes_db`.*
  > *3. Microservicio de Órdenes en el puerto 5003 con base de datos `cuc_ordenes_db`.*
  > *Al frente de ellos tenemos un API Gateway centralizado en el puerto 8080 que actúa como entrada única, gestionando el enrutamiento, la observabilidad, la transformación de cabeceras y la agregación de datos."*

---

### Minuto 0:45 a 1:30 | Arranque de los Servicios y Observabilidad
* **Qué mostrar en pantalla:** La terminal en la carpeta raíz del proyecto.
* **Acción:** Ejecuta:
  ```bash
  npm run seed
  npm start
  ```
* **Qué decir:**
  > *"Primero ejecutamos el script seed para poblar datos de prueba limpios en MongoDB.*  
  > *Luego iniciamos la solución con `npm start`. Como se puede observar en la consola, la herramienta levanta en paralelo los 4 servicios de forma concurrente.*  
  > *Cada servicio se conecta exitosamente a su base de datos NoSQL MongoDB individual y queda a la escucha en sus puertos respectivos (5001, 5002, 5003 y el Gateway en el 8080).*  
  > *Además, los servicios cuentan con observabilidad configurada, imprimiendo timestamps, identificadores de solicitud y tiempos de respuesta."*

---

### Minuto 1:30 a 2:30 | Pruebas de Entrada Única y Enrutamiento en Postman
* **Qué mostrar en pantalla:** Postman con la colección importada `Tarea Corta 2 - API Gateway y Microservicios (CUC)`.
* **Acciones en Postman:**
  1. Ejecuta la petición **`00 - Gateway General -> Gateway Health Check`** (`GET http://localhost:8080/health`).
     > *"Probamos el health check del Gateway en el puerto 8080. Nos confirma que está UP y nos muestra los servicios downstream registrados."*
  2. Ejecuta **`01 - Microservicio Productos -> Listar todos los productos`** (`GET http://localhost:8080/api/productos`).
     > *"Hacemos la consulta a través de la URL del Gateway `/api/productos`. El Gateway enruta la petición hacia el puerto 5001 y nos devuelve el catálogo con código 200."*
  3. Ejecuta **`02 - Microservicio Clientes -> Listar todos los clientes`** (`GET http://localhost:8080/api/clientes`).
     > *"De igual forma, consumimos `/api/clientes` a través del puerto único 8080 y obtenemos los clientes registrados."*

---

### Minuto 2:30 a 3:45 | Demostración de Comunicación Inter-Servicio (Órdenes)
* **Qué mostrar en pantalla:** Postman y la consola de logs dividida en la pantalla.
* **Acción en Postman:**
  1. Selecciona **`03 - Microservicio Órdenes -> Crear orden`** (`POST http://localhost:8080/api/ordenes`).
  2. Muestra el payload JSON con `clienteId` y el arreglo de `items` con `productoId` y `cantidad: 2`.
  3. Presiona **Send**.
* **Qué decir:**
  > *"Aquí demostramos el requerimiento obligatorio de comunicación inter-servicio:*  
  > *Cuando el cliente solicita crear una orden en el microservicio de órdenes, este no confía a ciegas en los datos:*  
  > *1. Hace una llamada HTTP interna hacia el microservicio de Clientes (puerto 5002) para validar que el cliente exista y esté activo.*  
  > *2. Hace llamadas internas hacia el microservicio de Productos (puerto 5001) para comprobar el stock y tomar el precio oficial del catálogo.*  
  > *3. Mediante un endpoint inter-servicio, descuenta automáticamente las 2 unidades del inventario de Productos.*  
  > *Como vemos en la respuesta 201 Created, la orden se calculó en $90 y en la terminal se aprecian los logs de las llamadas entre los microservicios."*
  4. Vuelve a consultar el producto en Postman para mostrar que el stock bajó efectivamente de 30 a 28.

---

### Minuto 3:45 a 4:45 | Políticas Obligatorias del Gateway (Transformación y Agregación)
* **Qué mostrar en pantalla:** Postman.
* **Acciones:**
  1. **Política 1 - Transformación de Cabeceras y Rutas:**
     * En cualquier respuesta de Postman, abre la pestaña **Headers** y muestra:
       - `X-Gateway-Processed-By: CUC-API-Gateway`
       - `X-Request-Id: gw-...`
     > *"Demostramos la Política de Transformación de Cabeceras: el Gateway inyecta headers de rastreo y correlación únicos `X-Request-Id` y oculta información interna del backend."*
  2. **Política 2 - Agregación (BFF / API Composition):**
     * Ejecuta **`04 - Políticas del Gateway -> Agregación: Resumen Orden Completa`** (`GET http://localhost:8080/api/resumen-orden/{{orden_id}}`).
     > *"Demostramos la Política de Agregación: En un solo llamado al Gateway `/api/resumen-orden/:id`, el Gateway consulta concurrentemente el servicio de órdenes, el de clientes y el de productos, entregándole al cliente una respuesta unificada con los datos completos del comprador y los detalles del producto en un tiempo de tan solo 30 milisegundos."*
  3. Ejecuta **`Gateway Dashboard`** (`GET http://localhost:8080/api/dashboard`) para mostrar la consolidación global de estadísticas de los 3 microservicios.

---

### Minuto 4:45 a 5:15 | Cierre y Conclusiones
* **Qué mostrar en pantalla:** Vuelve a enfocar la terminal mostrando los logs limpios y organizados.
* **Qué decir:**
  > *"Para concluir, en la consola podemos constatar la observabilidad completa: cada solicitud muestra su entrada [IN], el enrutamiento a través del Gateway con su Request ID, y la salida [OUT] con el código HTTP y los milisegundos de latencia.*  
  > *Cumplimos con todos los lineamientos solicitados: persistencia NoSQL en MongoDB, 3 microservicios independientes, comunicación inter-servicio, punto de entrada único, políticas de transformación y agregación, y documentación formal.*  
  > *Muchas gracias por su atención."*

---

## 📸 CAPTURAS DE PANTALLA RECOMENDADAS PARA EL DOCUMENTO DE EVIDENCIAS
1. **Captura 1:** Terminal ejecutando `npm start` mostrando los 4 servicios activos y conectados a MongoDB.
2. **Captura 2:** Postman ejecutando `GET /api/productos` con respuesta 200 OK.
3. **Captura 3:** Postman ejecutando `POST /api/ordenes` mostrando la validación inter-servicio y la creación de la orden.
4. **Captura 4:** Postman ejecutando `GET /api/resumen-orden/:id` mostrando la agregación BFF unificada.
5. **Captura 5:** Terminal mostrando los logs detallados del Gateway y los microservicios con los tiempos de respuesta.
