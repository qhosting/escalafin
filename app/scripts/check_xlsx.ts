import * as XLSX from 'xlsx';
import * as fs from 'fs';

try {
    const workbook = XLSX.readFile('../temporal/plantilla_sistemaprestamos.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    fs.writeFileSync('xlsx_headers.json', JSON.stringify({ headers: data[0], firstRow: data[1] }, null, 2));
} catch (e) {
    console.error('Error reading excel:', e);
}
