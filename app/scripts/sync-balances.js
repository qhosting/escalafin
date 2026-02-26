
const fs = require('fs');
const path = require('path');

const plantillaPath = path.join('c:', 'Users', 'Admin', 'Proyectos', 'escalafin', 'temporal', 'plantilla_migracion_MAYUSCULA.csv');
const carteraPath = path.join('c:', 'Users', 'Admin', 'Proyectos', 'escalafin', 'temporal', 'CARTERA_MIGRACION_MAYUSCULA.csv');
const outputPath = path.join('c:', 'Users', 'Admin', 'Proyectos', 'escalafin', 'temporal', 'PLANTILLA_CON_SALDOS_ACTUALIZADOS.csv');

function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    if (lines.length === 0) return { headers: [], rows: [] };

    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toUpperCase());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        // Split by comma but handle quotes
        const values = [];
        let current = '';
        let inQuotes = false;
        for (let char of lines[i]) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        const row = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
        });
        rows.push(row);
    }
    return { headers, rows };
}

console.log('Reading files...');
const plantilla = parseCSV(plantillaPath);
const cartera = parseCSV(carteraPath);

// Create a map of name -> balance from Cartera
// key: "NOMBRE APELLIDO"
const balanceMap = new Map();
cartera.rows.forEach(row => {
    const key = `${row.NOMBRE} ${row.APELLIDO}`.trim().toUpperCase();
    balanceMap.set(key, row.SALDO_ACTUAL);
});

console.log(`Balances found in Cartera: ${balanceMap.size}`);

// Update Plantilla rows
let updatedCount = 0;
const updatedRows = plantilla.rows.map(row => {
    const key = `${row.NOMBRE} ${row.APELLIDO}`.trim().toUpperCase();
    if (balanceMap.has(key)) {
        row.SALDO_ACTUAL = balanceMap.get(key);
        updatedCount++;
    }
    return row;
});

// Generate output
const outputLines = [];
outputLines.push(plantilla.headers.join(','));

updatedRows.forEach(row => {
    const values = plantilla.headers.map(h => `"${row[h]}"`);
    outputLines.push(values.join(','));
});

fs.writeFileSync(outputPath, outputLines.join('\n'), 'utf8');

console.log(`Update process finished.`);
console.log(`Total rows in Plantilla: ${plantilla.rows.length}`);
console.log(`Saldos updated (matches found): ${updatedCount}`);
console.log(`File saved to: ${outputPath}`);
