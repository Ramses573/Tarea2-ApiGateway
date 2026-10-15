const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const data = [
  {
    "Miembro del Equipo": "Héctor Román Arrieta",
    "Rol en el Proyecto": "Backend Developer",
    "Módulo / Tarea Asignada": "Microservicio de Productos / Catálogo",
    "% Participación": "20%",
    "Entregables Concretos": "Desarrollo de API REST en puerto 5001, modelo NoSQL en MongoDB (cuc_productos_db), endpoints CRUD, lógica de validación de stock y endpoint de descuento de inventario."
  },
  {
    "Miembro del Equipo": "Ramsés Aguilar Monge",
    "Rol en el Proyecto": "Líder Técnico & Arquitectura",
    "Módulo / Tarea Asignada": "API Gateway Centralizado y Enrutamiento",
    "% Participación": "20%",
    "Entregables Concretos": "Diseño del Gateway en puerto 8080, middleware de enrutamiento perimetral, política de transformación de cabeceras (X-Gateway, X-Request-Id), observabilidad y logging de tráfico."
  },
  {
    "Miembro del Equipo": "Alejandro Morales",
    "Rol en el Proyecto": "Backend & Documentación",
    "Módulo / Tarea Asignada": "Microservicio de Clientes e Investigación Teórica",
    "% Participación": "20%",
    "Entregables Concretos": "Desarrollo de API REST en puerto 5002, modelo NoSQL en MongoDB (cuc_clientes_db), scripts de seed de datos y redacción formal del documento de investigación teórica en formato APA."
  },
  {
    "Miembro del Equipo": "Fabián Espinoza Méndez",
    "Rol en el Proyecto": "Backend Developer",
    "Módulo / Tarea Asignada": "Microservicio de Órdenes y Comunicación Inter-Servicio",
    "% Participación": "20%",
    "Entregables Concretos": "Desarrollo de API REST en puerto 5003, modelo NoSQL en MongoDB (cuc_ordenes_db), comunicación inter-servicio con Productos y Clientes para validación de stock y precios."
  },
  {
    "Miembro del Equipo": "José Rodolfo Morales Calderón",
    "Rol en el Proyecto": "Backend & Integración",
    "Módulo / Tarea Asignada": "Política de Agregación y Pruebas Postman",
    "% Participación": "20%",
    "Entregables Concretos": "Endpoint de agregación BFF (/api/resumen-orden/:id), agregación de dashboard general (/api/dashboard) y diseño de la colección completa de pruebas en Postman v2.1."
  }
];

// 1. Crear archivo XLSX nativo de Excel con estilos y anchos
const worksheet = XLSX.utils.json_to_sheet(data);

worksheet['!cols'] = [
  { wch: 32 }, // Miembro del Equipo
  { wch: 32 }, // Rol en el Proyecto
  { wch: 48 }, // Módulo / Tarea Asignada
  { wch: 18 }, // % Participación
  { wch: 80 }  // Entregables Concretos
];

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Matriz Responsabilidades");

const xlsxPath = path.join(__dirname, 'docs', 'Matriz_Responsabilidades.xlsx');
XLSX.writeFile(workbook, xlsxPath);
console.log(`✅ Archivo Excel (.xlsx) generado exitosamente en: ${xlsxPath}`);

// 2. Intentar actualizar el CSV si no está bloqueado por Excel
try {
  const csvHeader = "Miembro del Equipo;Rol en el Proyecto;Módulo / Tarea Asignada;% Participación;Entregables Concretos\n";
  const csvRows = data.map(row => 
    `"${row["Miembro del Equipo"]}";"${row["Rol en el Proyecto"]}";"${row["Módulo / Tarea Asignada"]}";"${row["% Participación"]}";"${row["Entregables Concretos"]}"`
  ).join("\n");

  const bom = "\ufeff";
  const csvPath = path.join(__dirname, 'docs', 'Matriz_Responsabilidades.csv');
  fs.writeFileSync(csvPath, bom + csvHeader + csvRows, { encoding: 'utf8' });
  console.log(`✅ Archivo CSV con delimitador ';' y UTF-8 BOM actualizado: ${csvPath}`);
} catch (err) {
  if (err.code === 'EBUSY') {
    console.log('ℹ️ El archivo CSV está actualmente abierto en Excel por el usuario. El nuevo archivo .xlsx ya está listo.');
  } else {
    console.error('Error al escribir CSV:', err);
  }
}
