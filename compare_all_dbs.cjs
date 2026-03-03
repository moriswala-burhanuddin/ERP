const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

app.whenReady().then(() => {
    const searchResultPath = 'd:\\NEW-ERP\\storeflow-erp\\search_results_v4.json';
    const finalReportPath = 'd:\\NEW-ERP\\storeflow-erp\\db_comparison_report.json';

    if (!fs.existsSync(searchResultPath)) {
        console.error('Search results not found');
        process.exit(1);
    }

    const files = JSON.parse(fs.readFileSync(searchResultPath, 'utf8'));
    const report = [];

    files.forEach(file => {
        if (!file.path.endsWith('.db')) return;

        try {
            const db = new Database(file.path, { readonly: true });
            const products = db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='products'").get().count > 0
                ? db.prepare('SELECT COUNT(*) as count FROM products').get().count
                : 0;
            const sales = db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='sales'").get().count > 0
                ? db.prepare('SELECT COUNT(*) as count FROM sales').get().count
                : 0;

            report.push({
                path: file.path,
                products,
                sales,
                size: file.size,
                mtime: file.mtime
            });
            db.close();
        } catch (e) {
            // Skip non-sqlite or locked files
        }
    });

    fs.writeFileSync(finalReportPath, JSON.stringify(report, null, 2));
    console.log('Comparison report generated');
    process.exit(0);
});
