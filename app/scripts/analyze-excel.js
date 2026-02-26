
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'Admin', 'Proyectos', 'escalafin', 'temporal', 'plantilla_sistemaprestamos.xlsx');

if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
}

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

if (data.length === 0) {
    console.log('No data found in the Excel file.');
} else {
    const headers = Object.keys(data[0]);
    console.log('Excel Headers:', headers);
    console.log('\nFirst 3 rows of data:');
    console.log(JSON.stringify(data.slice(0, 3), null, 2));

    const requiredHeaders = ['nombre', 'apellido', 'email', 'telefono'];
    console.log('\nRequired Client Importer Headers:', requiredHeaders);

    const missing = requiredHeaders.filter(h => !headers.map(xh => xh.toLowerCase()).includes(h));
    if (missing.length > 0) {
        console.log('\nMissing required headers:', missing);
    } else {
        console.log('\nAll required headers are present!');
    }
}
