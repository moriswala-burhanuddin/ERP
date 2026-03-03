const path = require('path');
const os = require('os');
const fs = require('fs');

const roaming = path.join(os.homedir(), 'AppData', 'Roaming');
const results = [];

function search(dir, depth = 0) {
    if (depth > 4) return; // Prevent infinite recursion
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            try {
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    if (!['node_modules', '.git', 'Cache', 'GPUCache'].includes(file)) {
                        search(fullPath, depth + 1);
                    }
                } else if (file.endsWith('.db')) {
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

console.log('Searching Roaming for any .db files...');
search(roaming);

fs.writeFileSync('d:\\NEW-ERP\\storeflow-erp\\search_results_v4.json', JSON.stringify(results, null, 2));
console.log(`Found ${results.length} files.`);
