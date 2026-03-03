const https = require('https');

const paths = [
    '/api/v1/sync/push',
    '/api/v1/sync/push/',
    '/api/v1/sync/pull',
    '/api/v1/sync/pull/',
    '/api/v1/auth/login',
    '/api/v1/auth/login/'
];

const host = 'erp.decentinstitute.in';

async function checkPath(path) {
    return new Promise((resolve) => {
        const options = {
            hostname: host,
            port: 443,
            path: path,
            method: 'POST', // Use POST as sync endpoints are POST
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            console.log(`PATH: ${path} -> STATUS: ${res.statusCode}`);
            resolve({ path, status: res.statusCode });
        });

        req.on('error', (e) => {
            console.error(`PATH: ${path} -> ERROR: ${e.message}`);
            resolve({ path, error: e.message });
        });

        // Send empty body
        req.write(JSON.stringify({}));
        req.end();
    });
}

async function run() {
    console.log(`Checking endpoints on ${host}...`);
    for (const path of paths) {
        await checkPath(path);
    }
}

run();
