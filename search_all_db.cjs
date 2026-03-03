const path = require('path');
const os = require('os');
const fs = require('fs');

const roaming = path.join(os.homedir(), 'AppData', 'Roaming');
const results = [];

function search(dir) {
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            try {
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    if (file !== 'node_modules' && file !== '.git') {
                        search(fullPath);
                    }
                } else if (file === 'storeflow.db') {
                    results.push({
                        path: fullPath,
                        size: stat.size,
                        mtime: stat.mtime
                    });
                }
            } catch (e) { }
        }
    } catch (e) { }
}

console.log('Searching Roaming for storeflow.db...');
search(roaming);

fs.writeFileSync('d:\\NEW-ERP\\storeflow-erp\\search_results_v3.json', JSON.stringify(results, null, 2));
console.log(`Found ${results.length} files.`);
