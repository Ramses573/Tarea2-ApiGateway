# COLEGIO UNIVERSITARIO DE CARTAGO
## DEPARTAMENTO DE TECNOLOGÍAS DE LA INFORMACIÓN
### CURSO: PROGRAMACIÓN V

---

# TAREA CORTA 2: INVESTIGACIÓN ARQUITECTURA DE API GATEWAYS Y MICROSERVICIOS

**Profesor:** Prof. Ing. Gabriel González Solano  
**Integrantes del Equipo:**  
- Héctor Román Arrieta  
- Ramsés Aguilar Monge  
- Alejandro Morales  
- Fabián Espinoza Méndez  
- José Rodolfo Morales Calderón  
**Fecha de Entrega:** 15 de Octubre de 2026  
**Periodo Académico:** III Cuatrimestre 2026  

---

## ÍNDICE DE CONTENIDOS

1. [Introducción](#introducción)
2. [1. Definición de API Gateway y su Propósito](#1-definición-de-api-gateway-y-su-propósito)
3. [2. Problemas que Resuelve y Diferencias con un Reverse Proxy Tradicional](#2-problemas-que-resuelve-y-diferencias-con-un-reverse-proxy-tradicional)
4. [3. Funciones Comunes del API Gateway](#3-funciones-comunes-del-api-gateway)
   - 3.1. Enrutamiento Dinámico y Proxy Inverso
   - 3.2. Autenticación y Autorización Centralizada
   - 3.3. Limitación de Tasa (Rate Limiting y Throttling)
   - 3.4. Almacenamiento en Caché (Caching)
   - 3.5. Terminación SSL/TLS
   - 3.6. Balanceo de Carga (Load Balancing)
   - 3.7. Transformación de Peticiones y Respuestas
   - 3.8. Agregación de Datos y Backend for Frontend (BFF)
   - 3.9. Observabilidad Centralizada (Logging, Métricas y Trazabilidad)
   - 3.10. Resiliencia y Disyuntor (Circuit Breaking)
5. [4. Ventajas y Desventajas de la Implementación de un Gateway](#4-ventajas-y-desventajas-de-la-implementación-de-un-gateway)
6. [5. Patrones Arquitectónicos Relacionados](#5-patrones-arquitectónicos-relacionados)
   - 5.1. Backend for Frontend (BFF)
   - 5.2. Patrón Higo Estrangulador (Strangler Fig)
   - 5.3. Composición de API (API Composition)
   - 5.4. Descubrimiento de Servicios (Service Discovery)
7. [6. Comparativa de Herramientas de API Gateway](#6-comparativa-de-herramientas-de-api-gateway)
8. [7. Conclusiones y Recomendaciones: Cuándo Usar y Cuándo Evitar un Gateway](#7-conclusiones-y-recomendaciones-cuándo-usar-y-cuándo-evitar-un-gateway)
9. [Referencias Bibliográficas (Normativa APA 7ª Edición)](#referencias-bibliográficas-normativa-apa-7ª-edición)

---

## INTRODUCCIÓN

En la evolución del desarrollo de software empresarial, la transición desde arquitecturas monolíticas centralizadas hacia sistemas distribuidos basados en **microservicios** ha permitido a las organizaciones alcanzar altos niveles de escalabilidad horizontal, despliegues continuos independientes y desacoplamiento de dominios comerciales (Newman, 2021). Sin embargo, esta descomposición introduce una complejidad de red inherente: decenas o cientos de servicios autónomos, cada uno con sus propias direcciones IP, puertos, protocolos y esquemas de datos.

Si los clientes externos (aplicaciones web SPA, dispositivos móviles nativos, sistemas de terceros) intentaran comunicarse directamente con cada microservicio individual, el sistema colapsaría bajo problemas severos de seguridad, acoplamiento extremo, sobrecarga de solicitudes de red y dificultades insalvables de gobernanza. Para abordar esta problemática estructural surge el patrón de **API Gateway**.

El presente informe de investigación desglosa formalmente qué es un API Gateway, su propósito central en arquitecturas modernas, las diferencias funcionales críticas que lo separan de un proxy inverso convencional, sus capacidades esenciales, sus riesgos arquitectónicos, los patrones de diseño asociados, una matriz comparativa entre las principales herramientas de la industria y las directrices para su adopción o desestimación en proyectos de software.

---

## 1. DEFINICIÓN DE API GATEWAY Y SU PROPÓSITO

Un **API Gateway** es un componente de software arquitectónico que se sitúa como intermediario o punto de entrada único (*Single Entry Point*) entre los clientes externos y un conjunto de microservicios internos que componen una aplicación distribuida (Richardson, 2018).

El propósito primordial del API Gateway es abstraer la topología y complejidad interna del ecosistema de microservicios, proporcionando a los consumidores una interfaz consolidada, uniforme, segura y optimizada. En términos conceptuales, actúa como el "director de orquesta" y la "frontera perimetral" de la plataforma.

### Objetivos Esenciales:
- **Encapsulación Interna:** Oculta los detalles de implementación, ubicaciones físicas (hosts y puertos) y tecnologías de almacenamiento subyacentes.
- **Reducción de Latencia en Red Móvil:** Disminuye el número de viajes de ida y vuelta (*round-trips*) entre dispositivos de clientes lentos y el clúster de microservicios.
- **Centralización de Preocupaciones Transversales (*Cross-Cutting Concerns*):** Libera a los equipos de desarrollo de microservicios de reimplementar lógica de autenticación, CORS, cuotas de consumo y monitoreo en cada microservicio individual.

---

## 2. PROBLEMAS QUE RESUELVE Y DIFERENCIAS CON UN REVERSE PROXY TRADICIONAL

Uno de los equívocos más frecuentes en ingeniería de software consiste en equiparar un **API Gateway** con un **Reverse Proxy** tradicional (como una instancia estándar de NGINX, Apache HTTPD o HAProxy). Aunque ambos componentes interceptan y redirigen el tráfico HTTP, operan en diferentes capas de abstracción y resuelven problemas con alcances totalmente distintos.

### Problemas Críticos que Resuelve el API Gateway:
1. **Proliferación Excesiva de Peticiones (*Chatty I/O*):** Si una pantalla móvil necesita mostrar la información de un usuario, su historial de pedidos y recomendaciones de productos, sin un Gateway el dispositivo cliente se vería forzado a disparar 3 a 5 peticiones HTTP por separado sobre redes móviles de alta latencia. El Gateway permite consolidar esto mediante agregación en una sola petición.
2. **Incompatibilidad de Protocolos:** Los clientes externos suelen hablar HTTP/1.1 o HTTP/2 REST con payloads JSON, mientras que la comunicación interna de microservicios de alto rendimiento suele emplear gRPC, AMQP, Apache Kafka o Protocol Buffers. El Gateway realiza la mediación y traducción protocolar de frontera.
3. **Vulnerabilidad de Superficie Expuesta:** Sin un Gateway, cada microservicio debe exponer una dirección IP pública, puertos abiertos y certificados TLS, multiplicando los vectores de ataque. Con el Gateway, la infraestructura interna reside en redes privadas seguras (VPC).

### Matriz Diferencial: Reverse Proxy Tradicional vs. API Gateway

| Característica | Reverse Proxy Tradicional (ej. NGINX clásico, HAProxy) | API Gateway Moderno (ej. Kong, Ocelot, YARP, Traefik) |
|---|---|---|
| **Capa Principal de Operación** | Capas 4 (Transporte) y 7 básica (HTTP básico). | Capa 7 avanzada (Capa de Aplicación y Dominio de Negocio ligero). |
| **Enrutamiento** | Estático, basado en reglas de URI fijas y archivos de configuración en disco. | Dinámico, reactivo a catálogos de Service Discovery (Consul, Eureka, K8s) y metadatos. |
| **Composición y Agregación** | No disponible o sumamente compleja de programar mediante scripts de bajo nivel. | Nativa: permite componer datos de múltiples servicios en una única respuesta JSON estructurada. |
| **Seguridad de Aplicación** | Inspección TLS, cabeceras HTTP básicas y filtrado de IP. | Validación de JWT descentralizado, integración con OAuth2/OIDC, claims y scopes de autorización. |
| **Transformación de Mensajes** | Limitada a renombrado de cabeceras simples. | Capaz de reescribir cuerpos JSON, traducir XML a JSON o convertir HTTP a gRPC. |
| **Programabilidad y Extensibilidad** | Módulos compilados en C o directivas en Lua. | SDKs en C#, Node.js, Go o Java, plugins dinámicos y middlewares programáticos. |

En conclusión: Un reverse proxy se enfoca en la optimización del transporte de paquetes, entrega de archivos estáticos y balanceo de carga de infraestructura; un API Gateway se enfoca en la **orquestación, gobernanza, seguridad y experiencia del consumidor del API**.

---

## 3. FUNCIONES COMUNES DEL API GATEWAY

A continuación, se describen diez de las capacidades más determinantes que provee un API Gateway en arquitecturas empresariales:

### 3.1. Enrutamiento Dinámico y Proxy Inverso (*Dynamic Routing*)
El Gateway analiza la ruta, el verbo HTTP y las cabeceras de cada solicitud entrante y la despacha al microservicio aguas abajo correspondiente. Permite que rutas orientadas al cliente (ej. `/api/productos/v1`) sean mapeadas a instancias internas cambiantes (ej. `http://10.0.4.15:5001/productos`).

### 3.2. Autenticación y Autorización Centralizada
El Gateway asume la responsabilidad de verificar tokens criptográficos (como JSON Web Tokens - JWT) emitidos por un Identity Provider (IdP) externo. Si la firma es válida y el token no ha expirado, extrae los identificadores del usuario y los inyecta como cabeceras internas sanitizadas (`X-User-Id`, `X-User-Roles`), impidiendo que peticiones no autorizadas lleguen a la red interna y evitando que cada microservicio deba validar criptográficamente el JWT.

### 3.3. Limitación de Tasa y Estrangulamiento (*Rate Limiting & Throttling*)
Protege a los microservicios de ataques de denegación de servicio (DoS) o picos de tráfico desmedidos mediante la implementación de algoritmos formales como *Token Bucket* o *Leaky Bucket*. Permite aplicar cuotas por IP, por cliente autenticado o por nivel de suscripción (ej. 100 peticiones/minuto para usuarios gratuitos, 5000 para empresariales), retornando un código HTTP `429 Too Many Requests` cuando se excede el límite.

### 3.4. Almacenamiento en Caché (*Caching*)
Almacena temporalmente respuestas idempotentes de solicitudes `GET` (por ejemplo, catálogos de productos o información meteorológica). Si una solicitud idéntica se recibe dentro del periodo TTL (*Time-To-Live*), el Gateway responde inmediatamente desde la memoria (o clúster Redis de borde) sin sobrecargar ni despertar a los microservicios aguas abajo.

### 3.5. Terminación SSL/TLS (*SSL Termination*)
Gestiona la negociación criptográfica, certificados digitales y claves privadas en el borde perimetral. El tráfico externo llega cifrado mediante HTTPS/TLS, pero una vez validado por el Gateway, puede circular dentro de la red interna privada del clúster sobre HTTP simple o mTLS controlado, aliviando la sobrecarga computacional de cifrado/descifrado en cada servicio individual.

### 3.6. Balanceo de Carga (*Load Balancing*)
Distribuye el tráfico entrante equitativamente entre múltiples réplicas o instancias de un mismo microservicio utilizando algoritmos como Round Robin, Least Connections o Weighted Random. Puede realizar comprobaciones de salud periódicas (*Health Checks*) para redirigir tráfico únicamente hacia instancias saludables.

### 3.7. Transformación de Peticiones y Respuestas (*Request / Response Transformation*)
Capacidad de modificar dinámicamente cabeceras, rutas y payloads. Ejemplos de uso incluyen:
- Reescritura de endpoints antiguos para garantizar retrocompatibilidad.
- Eliminación de encabezados confidenciales generados internamente (`X-Internal-Server-Id`).
- Inyección de identificadores de trazabilidad (`X-Correlation-Id` o `X-Request-Id`).

### 3.8. Agregación de Datos y Backend for Frontend (*BFF*)
Permite que el Gateway consulte en paralelo o secuencialmente dos o más microservicios independientes y consolide sus respuestas en una sola estructura homogénea. Esto ahorra ancho de banda y latencia en el cliente y garantiza una experiencia de usuario fluida.

### 3.9. Observabilidad Centralizada (*Logging, Metrics & Distributed Tracing*)
Punto estratégico de telemetría. Genera un identificador de correlación único para cada transacción entrante, el cual viaja a través de todos los microservicios mediante encabezados de propagación (estándares W3C Trace Context u OpenTelemetry). Registra métricas de latencia de borde, códigos de error y tasas de tráfico.

### 3.10. Resiliencia y Disyuntor (*Circuit Breaking & Retries*)
Si un microservicio aguas abajo comienza a fallar consecutivamente o a experimentar degradación de latencia, el Gateway activa el patrón de disyuntor (*Circuit Breaker*), interrumpiendo las llamadas a dicho servicio y retornando una respuesta degradada por defecto (*fallback*), evitando el efecto dominó de saturación de hilos en toda la plataforma.

---

## 4. VENTAJAS Y DESVENTAJAS DE LA IMPLEMENTACIÓN DE UN GATEWAY

La adopción de un API Gateway conlleva un equilibrio de compromisos ingenieriles (*trade-offs*) que deben evaluarse detenidamente:

### Ventajas:
1. **Desacoplamiento Estructural:** Los clientes no dependen de la estructura física ni de las direcciones de los microservicios, lo que permite refactorizar la arquitectura interna (dividir o fusionar microservicios) sin romper la compatibilidad de los clientes externos.
2. **Homogeneidad de Políticas:** Las reglas de seguridad, CORS, rate limiting y auditoría se definen en un solo punto, reduciendo el error humano y la duplicación de código.
3. **Optimización de Experiencia del Usuario:** Mediante agregación y adaptación de cargas de datos según el tipo de cliente.
4. **Seguridad en Profundidad:** Limita el acceso a la red interna y reduce la superficie expuesta a ataques.

### Desventajas y Riesgos Arquitectónicos:
1. **Punto Único de Falla (*Single Point of Failure - SPOF*):** Si la capa de Gateway sufre una caída de infraestructura, todo el ecosistema de microservicios queda inaccesible para los clientes externos. Debe diseñarse con redundancia activa, balanceadores de DNS y alta disponibilidad.
2. **Latencia Adicional (*Network Hop Overhead*):** Cada solicitud debe atravesar una capa intermedia adicional de procesamiento, enrutamiento y serialización, lo que añade milisegundos a la latencia total de la transacción.
3. **Cuello de Botella de Rendimiento (*Bottleneck*):** Si no se le asignan recursos de cómputo suficientes o si se sobrecarga con lógica de negocio pesada, el Gateway se convierte en el limitante de rendimiento de todo el sistema.
4. **Riesgo de Acoplamiento y Monolito Oculto:** Un antipatrón común consiste en programar lógica de negocio compleja dentro del Gateway (reglas de cálculo, validaciones de dominio), convirtiéndolo en un "monolito distribuido" difícil de mantener.

---

## 5. PATRONES ARQUITECTÓNICOS RELACIONADOS

El diseño de un API Gateway converge con varios de los patrones arquitectónicos más relevantes descritos por Martin Fowler y Sam Newman:

### 5.1. Backend for Frontend (BFF)
Propuesto formalmente por Sam Newman. En lugar de tener un único Gateway masivo para todos los clientes imaginables, se crea un Gateway especializado para cada canal de consumo: un BFF para la aplicación iOS/Android, un BFF para la Web SPA y un BFF para partners B2B. Cada BFF adapta el formato de respuesta, el tamaño de la carga y los protocolos según los requerimientos precisos de su interfaz asociada.

### 5.2. Patrón Higo Estrangulador (*Strangler Fig Pattern*)
Descrito por Martin Fowler. Se utiliza para migrar gradualmente sistemas monolíticos legados hacia arquitecturas modernas de microservicios. El Gateway se posiciona al frente del monolito: inicialmente, el 100% de las rutas apuntan al monolito. Conforme se desarrolla un nuevo microservicio, el Gateway redirige esa ruta específica hacia el nuevo servicio, "estrangulando" progresivamente al monolito hasta su eventual reemplazo sin tiempo de inactividad.

### 5.3. Composición de API (*API Composition Pattern*)
Patrón alternativo a la falta de uniones SQL (*JOINs*) en microservicios que implementan el principio de *Database-per-Service*. Debido a que cada microservicio posee su propia base de datos (incluso NoSQL aisladas), no es posible ejecutar consultas multitabla. El Gateway o un componente orquestador ejecuta múltiples llamadas concurrentes y combina los resultados en memoria antes de responder al cliente.

### 5.4. Descubrimiento de Servicios (*Service Discovery*)
En entornos elásticos en la nube (como Kubernetes, Docker Swarm o AWS ECS), las instancias de microservicios se crean y destruyen dinámicamente con direcciones IP efímeras. El Gateway se integra con un registro de servicios (Consul, Eureka o el DNS interno de Kubernetes) para resolver en tiempo real la IP actual de las instancias disponibles.

---

## 6. COMPARATIVA DE HERRAMIENTAS DE API GATEWAY

A continuación, se presenta la tabla comparativa solicitada en la pauta de la tarea, analizando seis de las herramientas líderes en el mercado tecnológico:

| Herramienta | Lenguaje / Stack | Tipo | Curva de Aprendizaje | Funciones Clave | Caso Ideal de Uso |
|---|---|---|---|---|---|
| **Ocelot** | C# / .NET (ASP.NET Core) | Open-source | Baja a Intermedia para desarrolladores .NET | Enrutamiento declarativo vía JSON, agregación nativa de endpoints, balanceo de carga, caché de respuestas, integración con Consul y Eureka, autenticación JWT integrada. | Sistemas empresariales construidos sobre el ecosistema .NET / C# que buscan una solución ligera y acoplable mediante middleware en C#. |
| **Kong Gateway** | Lua / C / OpenResty (NGINX engine) | Open-source (con versión Enterprise comercial) | Media (requiere entender plugins de Lua o configuración declarativa decK) | Rendimiento ultrarrápido sub-milisegundo, ecosistema masivo de plugins oficiales (OAuth2, Rate Limiting, CORS, mTLS), arquitectura distribuida sin estado (*DB-less mode* o PostgreSQL). | Plataformas de alta concurrencia, pasarelas de pago y ecosistemas heterogéneos de microservicios con cientos de miles de peticiones por segundo. |
| **YARP (Yet Another Reverse Proxy)** | C# / .NET 8 y .NET 9 | Open-source (respaldado por Microsoft) | Baja para desarrolladores de .NET | Altísimo rendimiento nativo en .NET, soporte de HTTP/3, transformaciones programáticas de cabeceras y rutas, balanceo de carga pasivo y activo, integración con Kestrel. | Arquitecturas modernas en .NET que requieren rendimiento extremo y personalización milimétrica mediante código C# en lugar de archivos JSON rígidos. |
| **NGINX / NGINX Plus** | C | Open-source / Enterprise comercial | Media a Alta (sintaxis de directivas de configuración rígida) | Rendimiento legendario, bajo consumo de memoria RAM, terminación SSL muy rápida, balanceo de carga en capa 4 y 7, soporte de HTTP/2 y HTTP/3. | Punto de entrada perimetral de clústeres, proxy reverso de alto nivel y balanceador de carga general antes de llegar a gateways de capa de aplicación. |
| **Traefik** | Go | Open-source (con versión Enterprise) | Baja (configuración automática basada en etiquetas) | Detección automática de microservicios mediante integración nativa con Docker y Kubernetes, generación automática de certificados SSL con Let's Encrypt, dashboard web en tiempo real. | Entornos nativos en la nube, clústeres de contenedores Docker y orquestación con Kubernetes que requieren autodescubrimiento sin configuración manual de rutas. |
| **Spring Cloud Gateway** | Java / Kotlin (Spring Boot / Netty) | Open-source | Media a Alta (requiere dominio de Spring Framework y programación reactiva) | Enrutamiento dinámico reactivo no bloqueante basado en Project Reactor, filtros configurables, integración fluida con Eureka, Spring Security y Resilience4j. | Grandes organizaciones empresariales cuyo stack principal está fundamentado en Java y el ecosistema corporativo de Spring Boot. |

---

## 7. CONCLUSIONES Y RECOMENDACIONES: CUÁNDO USAR Y CUÁNDO EVITAR UN GATEWAY

El diseño arquitectónico no consiste en aplicar patrones por moda, sino en justificar objetivamente los beneficios frente a los costos operativos.

### ¿Cuándo es IMPRESCINDIBLE usar un API Gateway?
1. **Arquitecturas con múltiples microservicios (más de 3-4 servicios):** Donde la dispersión de URLs y puertos representa una carga insostenible para el frontend.
2. **Aplicaciones que atienden múltiples canales de clientes:** Web SPA, aplicaciones móviles nativas y sistemas de terceros con requisitos dispares de seguridad y payloads.
3. **Necesidad de observabilidad y auditoría rigurosa:** Cuando se exige registrar todas las transacciones que entran a la infraestructura con trazabilidad distribuida para cumplir normativas de seguridad (ISO 27001, PCI-DSS).
4. **Transición hacia Zero-Trust:** Cuando se desea establecer un perímetro de seguridad estricto donde los microservicios internos no son accesibles directamente desde el exterior.

### ¿Cuándo DEBE EVITARSE o postergarse el uso de un API Gateway?
1. **Arquitecturas Monolíticas:** Si la aplicación está empaquetada como un monolito único y cohesionado, un API Gateway agrega una capa redundante de latencia y complejidad operativa sin aportar valor real. Un reverse proxy clásico basta para SSL y balanceo.
2. **Sistemas con solo 1 o 2 microservicios triviales:** Si la sobrecarga de mantenimiento del Gateway supera los beneficios del desacoplamiento, es preferible la comunicación directa o un proxy elemental.
3. **Escenarios de Extrema Sensibilidad a la Latencia en Tiempo Real (HFT - High Frequency Trading, procesamiento de telemetría IoT de microsegundos):** Si cada milisegundo es crítico para el negocio, el salto de red adicional (*hop*) impuesto por el Gateway puede resultar inaceptable; en tales casos se prefiere Service Mesh interno directo.
4. **Equipos de desarrollo pequeños sin experiencia en sistemas distribuidos:** Si el equipo no cuenta con la madurez para monitorear y mitigar el riesgo de *Single Point of Failure* mediante clústeres de alta disponibilidad.

---

## 8. MATRIZ DE RESPONSABILIDADES Y DIVISIÓN DE TRABAJO DEL EQUIPO

De acuerdo con los lineamientos de la rúbrica del curso, a continuación se detalla la asignación de responsabilidades y el porcentaje de participación individual en el diseño, desarrollo, pruebas y documentación:

| Miembro del Equipo | Rol Principal | Módulo Asignado | % Part. | Entregables Concretos |
|---|---|---|:---:|---|
| **Ramsés Aguilar Monge** | Líder Técnico & Arquitectura | API Gateway Centralizado y Enrutamiento | **20%** | Diseño del Gateway en puerto 8080, middleware de enrutamiento perimetral, transformación de cabeceras (`X-Gateway`, `X-Request-Id`) y logging de observabilidad. |
| **José Rodolfo Morales Calderón** | Backend & Integración | Política de Agregación y Pruebas Postman | **20%** | Implementación del endpoint de agregación BFF (`/api/resumen-orden/:id`), agregación de dashboard general (`/api/dashboard`) y suite completa en Postman v2.1. |
| **Fabián Espinoza Méndez** | Backend Developer | Microservicio de Órdenes e Inter-Servicio | **20%** | API REST en puerto 5003, modelo NoSQL en MongoDB (`cuc_ordenes_db`), comunicación inter-servicio con Productos y Clientes para validación de stock y precios. |
| **Héctor Román Arrieta** | Backend Developer | Microservicio de Productos / Catálogo | **20%** | API REST en puerto 5001, modelo NoSQL en MongoDB (`cuc_productos_db`), endpoints CRUD, lógica de inventario y endpoint de descuento de stock. |
| **Alejandro Morales** | Backend & Documentación | Microservicio de Clientes e Investigación Teórica | **20%** | API REST en puerto 5002, modelo NoSQL en MongoDB (`cuc_clientes_db`), script de seed de datos y redacción formal del informe teórico en formato APA. |
| **TOTAL PARTICIPACIÓN** | | | **100%** | |

---

## REFERENCIAS BIBLIOGRÁFICAS (NORMATIVA APA 7ª EDICIÓN)

- Fowler, M. (2014). *Microservices: a definition of this new architectural term*. MartinFowler.com. https://martinfowler.com/articles/microservices.html
- Fowler, M. (2020). *StranglerFigApplication*. MartinFowler.com. https://martinfowler.com/bliki/StranglerFigApplication.html
- Kong Inc. (2023). *What is an API Gateway? Architecture, patterns, and best practices*. KongHQ Documentation. https://konghq.com/learning-center/api-gateway/what-is-an-api-gateway
- Microsoft Corporation. (2024). *Diseño de arquitectura de microservicios: Implementación de API Gateways con YARP y Ocelot*. Microsoft Learn Architecture Center. https://learn.microsoft.com/es-es/azure/architecture/microservices/design/gateway
- NGINX Inc. (2022). *Deploying NGINX as an API Gateway: Comprehensive architectural guide*. F5 Networks Technical Reports. https://www.nginx.com/blog/deploying-nginx-api-gateway/
- Newman, S. (2021). *Building Microservices: Designing Fine-Grained Systems* (2nd ed.). O'Reilly Media.
- Richardson, C. (2018). *Microservices Patterns: With examples in Java*. Manning Publications.
- Richardson, C. (2022). *Pattern: API Gateway / Backends for Frontends*. Microservices.io. https://microservices.io/patterns/apigateway.html
- Traefik Labs. (2024). *Traefik The Cloud Native Application Proxy: Architecture and core concepts*. Traefik Docs. https://doc.traefik.io/traefik/
