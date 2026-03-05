import { parseInventoryFile, validateInventoryRow } from './src/lib/inventory-utils.ts';
import fs from 'fs';
import path from 'path';

// Mock File object for Node environment
class MockFile {
    constructor(filePath) {
        this.name = path.basename(filePath);
        this.path = filePath;
    }
}

async function verify() {
    console.log("Starting verification...");

    const csvPath = 'product_import_template.csv';
    const xlsxPath = 'product_import_template.xlsx';

    // Since parseInventoryFile uses FileReader and File (browser APIs),
    // and we are in Node, let's just manually check if they exist and peek at headers
    // for now, as full browser-side testing requires different tools.
    // However, I can check if the files exist and have content.

    if (fs.existsSync(csvPath)) {
        console.log(`[OK] CSV file exists: ${csvPath}`);
        const csvContent = fs.readFileSync(csvPath, 'utf8');
        console.log("CSV Header Check:", csvContent.split('\n')[0]);
    } else {
        console.error(`[FAIL] CSV file missing: ${csvPath}`);
    }

    if (fs.existsSync(xlsxPath)) {
        console.log(`[OK] Excel file exists: ${xlsxPath}`);
        const stats = fs.statSync(xlsxPath);
        console.log(`Excel file size: ${stats.size} bytes`);
    } else {
        console.error(`[FAIL] Excel file missing: ${xlsxPath}`);
    }
}

verify();
