
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'Admin', 'Proyectos', 'escalafin', 'temporal', 'plantilla_sistemaprestamos.xlsx');
const outputPath = path.join('c:', 'Users', 'Admin', 'Proyectos', 'escalafin', 'temporal', 'plantilla_migracion_MAYUSCULA.csv');

if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
}

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

const csvRows = [];
const headers = [
    'nombre',
    'apellido',
    'email',
    'telefono',
    'direccion',
    'saldo_actual',
    'notas'
];

// All headers in UPPERCASE as requested (though the importer expects them lowercase, 
// I will provide them uppercase and mention it, or keep them lowercase for the code if needed.
// Actually, the user specifically said "todo el texto debe de estar en mayusculas", 
// but the importer code says: lines[0].split(',').map(h => h.trim().toLowerCase());
// So it will normalize them to lowercase anyway. I'll make them uppercase in the file.)
csvRows.push(headers.map(h => h.toUpperCase()).join(','));

data.forEach((row, index) => {
    let fullName = (row['Nombre completo'] || '').toString().trim();
    let parts = fullName.split(/\s+/);
    let nombre = (parts[0] || 'SIN NOMBRE').toUpperCase();
    let apellido = (parts.slice(1).join(' ') || 'SIN APELLIDO').toUpperCase();

    let telefono = (row['telefono'] || '').toString().toUpperCase();
    let direccion = (row['direccion completa'] || '').toString().toUpperCase();
    let saldo = (row['saldo actual'] || '0').toString().toUpperCase();

    // Generar email placeholder ya que es requerido por el sistema
    let email = `${nombre.replace(/\s+/g, '')}.${apellido.slice(0, 10).replace(/\s+/g, '')}.${index}@ESCALAFIN.COM`.toUpperCase();

    // Concatenar info extra en notas
    let extraInfo = [];
    if (row['nombre Aval']) extraInfo.push(`AVAL: ${row['nombre Aval']}`);
    if (row['tel aval']) extraInfo.push(`TEL AVAL: ${row['tel aval']}`);
    if (row['garantia1']) extraInfo.push(`GARANTIA: ${row['garantia1']}`);
    if (row['pago semanal']) extraInfo.push(`PAGO SEMANAL: ${row['pago semanal']}`);

    let notas = extraInfo.join(' | ').toUpperCase();

    const rowData = [
        nombre,
        apellido,
        email,
        telefono,
        direccion,
        saldo,
        notas
    ];

    // Escapar comas y comillas para CSV
    const escapedRow = rowData.map(v => `"${v.replace(/"/g, '""')}"`);
    csvRows.push(escapedRow.join(','));
});

fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf8');

console.log(`CSV generado exitosamente: ${outputPath}`);
console.log(`Registros procesados: ${data.length}`);
