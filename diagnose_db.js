const { app } = require('electron');
const path = require('path');
const fs = require('fs');

function checkPaths() {
    console.log('--- DB PATH DIAGNOSTICS ---');
    const userData = app.getPath('userData');
    console.log('Current UserData:', userData);

    const possiblePaths = [
        path.join(process.env.APPDATA, 'vite_react_shadcn_ts', 'storeflow.db'),
        path.join(process.env.APPDATA, 'invenza-erp', 'storeflow.db'),
        path.join(process.env.APPDATA, 'StoreFlow ERP', 'storeflow.db'),
        path.join(process.env.APPDATA, 'Hardware ERP', 'storeflow.db'),
        path.join(__dirname, 'storeflow.db'),
        path.join(userData, 'storeflow.db')
    ];

    possiblePaths.forEach(p => {
        if (fs.existsSync(p)) {
            const stats = fs.statSync(p);
            console.log(`[FOUND] ${p} (${(stats.size / 1024).toFixed(2)} KB) - Modified: ${stats.mtime}`);
        } else {
            console.log(`[MISSING] ${p}`);
        }
    });
}

// Ensure this is called when app is ready or just run it via node if paths are predictable
console.log('AppData Env:', process.env.APPDATA);
checkPaths();
process.exit(0);
