const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// We use a log file in the project root because console.log might be hard to capture
const logFile = path.join(__dirname, 'db_diagnostic.log');
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
};

fs.writeFileSync(logFile, `DB Diagnostic Run: ${new Date().toISOString()}\n`);

app.whenReady().then(() => {
    log('--- SYSTEM PATHS ---');
    const userData = app.getPath('userData');
    const appData = app.getPath('appData');
    log(`userData: ${userData}`);
    log(`appData: ${appData}`);

    const oldPath = path.join(appData, 'vite_react_shadcn_ts', 'storeflow.db');
    const newPath = path.join(userData, 'storeflow.db');

    log(`Expected Old Path: ${oldPath}`);
    log(`Expected New Path: ${newPath}`);

    log('--- FILE STATUS ---');
    [oldPath, newPath].forEach(p => {
        if (fs.existsSync(p)) {
            const stats = fs.statSync(p);
            log(`[EXISTS] ${p} - Size: ${stats.size} bytes - Modified: ${stats.mtime}`);
        } else {
            log(`[MISSING] ${p}`);
        }
    });

    log('--- RECOMMENDATION ---');
    if (fs.existsSync(oldPath) && fs.existsSync(newPath)) {
        const oldSize = fs.statSync(oldPath).size;
        const newSize = fs.statSync(newPath).size;
        if (oldSize > newSize && newSize < 100000) {
            log('ACTION: Suggesting migration (Old is larger, New is likely fresh).');
        } else {
            log('ACTION: None (New is larger or comparable).');
        }
    }

    log('--- FINISHED ---');
    process.exit(0);
});
