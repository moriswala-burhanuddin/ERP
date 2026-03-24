const https = require('https');

const API_URL = 'https://erp.tmr-tools.com';

console.log(`Checking connectivity to: ${API_URL}`);

https.get(API_URL, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    if (res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302) {
        console.log('Backend is reachable!');
    } else {
        console.log('Backend returned an unexpected status code.');
    }
}).on('error', (err) => {
    console.error(`Error connecting to backend: ${err.message}`);
});
