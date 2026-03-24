const https = require('https');
const host = 'erp.tmr-tools.com';

async function check(path) {
    return new Promise((resolve) => {
        const req = https.request({
            hostname: host,
            port: 443,
            path: path,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            console.log(`${path} -> ${res.statusCode}`);
            resolve();
        });
        req.on('error', (e) => {
            console.log(`${path} -> ERROR: ${e.message}`);
            resolve();
        });
        req.write(JSON.stringify({}));
        req.end();
    });
}

async function run() {
    await check('/api/v1/sync/push');
    await check('/api/v1/sync/push/');
    await check('/api/v1/sync/pull');
    await check('/api/v1/sync/pull/');
}
run();
