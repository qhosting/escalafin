
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'Admin', 'Proyectos', 'escalafin', 'temporal', 'CARTERA CREDITOS SAN JUAN.xlsx');
const outputPath = path.join('c:', 'Users', 'Admin', 'Proyectos', 'escalafin', 'temporal', 'CARTERA_MIGRACION_MAYUSCULA.csv');

if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
}

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Leemos con range: 2 para saltar el encabezado de título y la fila de números
const data = XLSX.utils.sheet_to_json(worksheet, { range: 1 });

const csvRows = [];
const headers = [
    'nombre',
    'apellido',
    'email',
    'telefono',
    'saldo_actual',
    'notas'
];

csvRows.push(headers.map(h => h.toUpperCase()).join(','));

let count = 0;
data.forEach((row, index) => {
    // La fila 1 (index 0 aquí) tenía los nombres de columnas reales: 
    // "NOMBRE DEL CLIENTE", "PRESTAMO", "SALDO", etc.
    // Pero sheet_to_json usa los valores de la primera fila como llaves.

    let rawName = row['NOMBRE DEL CLIENTE'] || '';
    if (!rawName || rawName === 'NOMBRE DEL CLIENTE') return; // Saltar encabezado o vacíos

    let fullName = rawName.toString().trim();
    let parts = fullName.split(/\s+/);
    let nombre = (parts[0] || 'SIN NOMBRE').toUpperCase();
    let apellido = (parts.slice(1).join(' ') || 'SIN APELLIDO').toUpperCase();

    let saldo = (row['SALDO'] || '0').toString().toUpperCase();
    let prestamo = (row['PRESTAMO'] || '0').toString().toUpperCase();
    let totalCredito = (row['TOTAL CREDITO'] || '0').toString().toUpperCase();

    // Generar email placeholder
    let email = `${nombre.replace(/\s+/g, '')}.${apellido.slice(0, 10).replace(/\s+/g, '')}.${index}@ESCALAFIN.COM`.toUpperCase();

    // Notas
    let notas = `PRESTAMO: ${prestamo} | TOTAL CREDITO: ${totalCredito} | ORIGEN: CARTERA SAN JUAN`.toUpperCase();

    const rowData = [
        nombre,
        apellido,
        email,
        '0000000000', // Teléfono no encontrado en este archivo, se pone placeholder
        saldo,
        notas
    ];

    const escapedRow = rowData.map(v => `"${v.replace(/"/g, '""')}"`);
    csvRows.push(escapedRow.join(','));
    count++;
});

fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf8');

console.log(`CSV generado exitosamente: ${outputPath}`);
console.log(`Registros procesados: ${count}`);
