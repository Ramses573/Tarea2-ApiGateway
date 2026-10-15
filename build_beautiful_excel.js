const path = require('path');
const ExcelJS = require('exceljs');

async function createBeautifulExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ramsés Aguilar Monge';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Matriz de Responsabilidades', {
    views: [{ showGridLines: true }]
  });

  // Configuración de anchos de columna
  worksheet.columns = [
    { key: 'miembro', width: 32 },
    { key: 'rol', width: 28 },
    { key: 'modulo', width: 44 },
    { key: 'porcentaje', width: 20 },
    { key: 'entregables', width: 75 }
  ];

  // 1. BANNER INSTITUCIONAL SUPERIOR
  worksheet.mergeCells('A2:E2');
  const title1 = worksheet.getCell('A2');
  title1.value = 'COLEGIO UNIVERSITARIO DE CARTAGO';
  title1.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  title1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B2545' } };
  title1.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 30;

  worksheet.mergeCells('A3:E3');
  const title2 = worksheet.getCell('A3');
  title2.value = 'PROGRAMACIÓN V — TAREA CORTA 2: ARQUITECTURA DE API GATEWAYS Y MICROSERVICIOS';
  title2.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  title2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF134074' } };
  title2.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(3).height = 22;

  worksheet.mergeCells('A4:E4');
  const title3 = worksheet.getCell('A4');
  title3.value = 'Docente: Prof. Ing. Gabriel González Solano   |   Fecha: 15 de Octubre de 2026   |   Periodo: III Cuatrimestre 2026';
  title3.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: 'FF334155' } };
  title3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF4F8' } };
  title3.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(4).height = 20;

  worksheet.getRow(5).height = 10; // Espaciador

  // 2. ENCABEZADOS DE LA TABLA (Fila 6)
  const headerRow = worksheet.getRow(6);
  headerRow.height = 28;
  headerRow.values = [
    'Miembro del Equipo',
    'Rol en el Proyecto',
    'Módulo / Responsabilidad',
    '% Participación',
    'Entregables Concretos'
  ];

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF002244' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF002244' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });

  // 3. DATOS DE LOS 5 INTEGRANTES
  const teamMembers = [
    {
      miembro: 'Héctor Román Arrieta',
      rol: 'Backend Developer',
      modulo: 'Microservicio de Productos / Catálogo',
      porcentaje: '20%',
      entregables: 'Desarrollo de API REST en puerto 5001, modelo NoSQL en MongoDB (cuc_productos_db), endpoints CRUD, control de inventario y endpoint de descuento de stock.'
    },
    {
      miembro: 'Ramsés Aguilar Monge',
      rol: 'Líder Técnico & Arquitectura',
      modulo: 'API Gateway Centralizado y Enrutamiento',
      porcentaje: '20%',
      entregables: 'Diseño del Gateway en puerto 8080, middleware de enrutamiento perimetral, política de transformación de cabeceras (X-Gateway, X-Request-Id), observabilidad y logging estructurado.'
    },
    {
      miembro: 'Alejandro Morales',
      rol: 'Backend & Documentación',
      modulo: 'Microservicio de Clientes e Investigación',
      porcentaje: '20%',
      entregables: 'Desarrollo de API REST en puerto 5002, modelo NoSQL en MongoDB (cuc_clientes_db), scripts de seed de datos y redacción formal del informe teórico en formato APA 7ma edición.'
    },
    {
      miembro: 'Fabián Espinoza Méndez',
      rol: 'Backend Developer',
      modulo: 'Microservicio de Órdenes e Inter-Servicio',
      porcentaje: '20%',
      entregables: 'Desarrollo de API REST en puerto 5003, modelo NoSQL en MongoDB (cuc_ordenes_db), comunicación inter-servicio con Productos y Clientes para validación de stock y precios.'
    },
    {
      miembro: 'José Rodolfo Morales Calderón',
      rol: 'Backend & Integración BFF',
      modulo: 'Política de Agregación y Pruebas Postman',
      porcentaje: '20%',
      entregables: 'Implementación del endpoint de agregación BFF (/api/resumen-orden/:id), agregación de dashboard (/api/dashboard) y diseño de la colección completa de pruebas en Postman v2.1.'
    }
  ];

  let rowIndex = 7;
  teamMembers.forEach((item, index) => {
    const row = worksheet.getRow(rowIndex);
    row.height = 36;
    row.values = [
      item.miembro,
      item.rol,
      item.modulo,
      item.porcentaje,
      item.entregables
    ];

    const isEven = index % 2 === 0;
    const bgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    // Celda 1: Nombre
    row.getCell(1).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    // Celda 2: Rol
    row.getCell(2).font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FF334155' } };
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

    // Celda 3: Módulo
    row.getCell(3).font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FF1E293B' } };
    row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    // Celda 4: Porcentaje (Badge verde)
    row.getCell(4).font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FF166534' } };
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };

    // Celda 5: Entregables
    row.getCell(5).font = { name: 'Segoe UI', size: 9, color: { argb: 'FF475569' } };
    row.getCell(5).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

    // Bordes y fondo para las demás celdas
    [1, 2, 3, 5].forEach((colIdx) => {
      row.getCell(colIdx).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    });

    for (let c = 1; c <= 5; c++) {
      row.getCell(c).border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    }

    rowIndex++;
  });

  // 4. FILA DE TOTAL (Fila 12)
  const totalRow = worksheet.getRow(rowIndex);
  totalRow.height = 26;

  worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);
  const totalLabel = worksheet.getCell(`A${rowIndex}`);
  totalLabel.value = 'TOTAL DE PARTICIPACIÓN DEL EQUIPO:';
  totalLabel.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
  totalLabel.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
  totalLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

  const totalValue = worksheet.getCell(`D${rowIndex}`);
  totalValue.value = '100%';
  totalValue.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF003366' } };
  totalValue.alignment = { horizontal: 'center', vertical: 'middle' };
  totalValue.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCBD5E1' } };

  const totalNote = worksheet.getCell(`E${rowIndex}`);
  totalNote.value = 'Todos los requerimientos funcionales, gateway y teóricos cubiertos de forma equitativa.';
  totalNote.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF64748B' } };
  totalNote.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  totalNote.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

  for (let c = 1; c <= 5; c++) {
    totalRow.getCell(c).border = {
      top: { style: 'medium', color: { argb: 'FF003366' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'double', color: { argb: 'FF003366' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } }
    };
  }

  // 5. TARJETAS INFORMATIVAS INFERIORES (Fila 14 a 16)
  rowIndex += 2;
  worksheet.mergeCells(`A${rowIndex}:E${rowIndex}`);
  const note1 = worksheet.getCell(`A${rowIndex}`);
  note1.value = '📌 Arquitectura: 3 Microservicios independientes (5001, 5002, 5003) + API Gateway centralizado (8080) con Entrada Única.';
  note1.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF1E3A8A' } };
  note1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
  note1.alignment = { vertical: 'middle', indent: 1 };
  worksheet.getRow(rowIndex).height = 20;

  rowIndex++;
  worksheet.mergeCells(`A${rowIndex}:E${rowIndex}`);
  const note2 = worksheet.getCell(`A${rowIndex}`);
  note2.value = '🍃 Base de Datos: Persistencia NoSQL aislada en MongoDB (cuc_productos_db, cuc_clientes_db, cuc_ordenes_db).';
  note2.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF065F46' } };
  note2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
  note2.alignment = { vertical: 'middle', indent: 1 };
  worksheet.getRow(rowIndex).height = 20;

  // Guardar archivo
  const outputPath = path.join(__dirname, 'docs', 'Matriz_Responsabilidades.xlsx');
  
  try {
    await workbook.xlsx.writeFile(outputPath);
    console.log(`🎉 Archivo Excel estilizado generado exitosamente en: ${outputPath}`);
  } catch (err) {
    if (err.code === 'EBUSY') {
      const altPath = path.join(__dirname, 'docs', 'Matriz_Responsabilidades_Diseno.xlsx');
      await workbook.xlsx.writeFile(altPath);
      console.log(`⚠️ Archivo original bloqueado por Excel. Guardado como versión diseñada en: ${altPath}`);
    } else {
      throw err;
    }
  }
}

createBeautifulExcel().catch(console.error);
