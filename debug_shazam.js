const https = require('https');
const fs = require('fs');

const rapidApiKey = 'e23690611emshf5e6048c757c319p1f5c11jsn68a1f1bb8e5c';
const host = 'shazam.p.rapidapi.com';
const endpoint = '/songs/v2/detect';

// Simple base64 string for testing (simulates silence or basic noise)
const audioBuffer = Buffer.alloc(1000).toString('base64');

const options = {
    method: 'POST',
    hostname: host,
    path: endpoint + '?timezone=America%2FChicago&locale=en-US',
    headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': host,
        'content-type': 'text/plain'
    }
};

console.log(`Testing API: https://${host}${endpoint}`);

const req = https.request(options, function (res) {
    const chunks = [];

    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);

    if (res.statusCode >= 300 && res.statusCode < 400) {
        console.error(`REDIRECT LOCATION: ${res.headers.location}`);
    }

    res.on('data', function (chunk) {
        chunks.push(chunk);
    });

    res.on('end', function () {
        const body = Buffer.concat(chunks);
        console.log("Response Body:", body.toString());
    });
});

req.on('error', function (e) {
    console.error("Request Error:", e);
});

req.write(audioBuffer);
req.end();
