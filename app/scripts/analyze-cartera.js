
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'Admin', 'Proyectos', 'escalafin', 'temporal', 'CARTERA CREDITOS SAN JUAN.xlsx');

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
    console.log('\nFirst 2 rows of data:');
    console.log(JSON.stringify(data.slice(0, 2), null, 2));
}
