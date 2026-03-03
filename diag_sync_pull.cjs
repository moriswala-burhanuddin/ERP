const https = require('https');

const API_URL = 'erp.decentinstitute.in';
const STORE_ID = 'store-1';
const AUTH_TOKEN = 'your_token_here'; // This script will likely fail without a real token, but we can check if it gets past the 400 validation

const data = JSON.stringify({
    store_id: STORE_ID,
    last_sync: '2000-01-01T00:00:00.000Z'
});

const options = {
    hostname: API_URL,
    port: 443,
    path: '/api/v1/sync/pull',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        // 'Authorization': `Bearer ${AUTH_TOKEN}` // Uncomment if testing with token
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
