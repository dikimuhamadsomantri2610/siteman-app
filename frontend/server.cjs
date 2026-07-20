const express = require('express');
const path = require('path');
const http = require('http');

const app = express();
const PORT = 3000;
const BACKEND_PORT = 5000;
const BACKEND_HOST = '127.0.0.1';

// 1. Proxy semua request /api ke backend port 5000
//    Menggunakan node http bawaan agar path /api/... diteruskan apa adanya
app.use('/api', (req, res) => {
    const options = {
        hostname: BACKEND_HOST,
        port: BACKEND_PORT,
        path: '/api' + req.url,  // tetap sertakan prefix /api
        method: req.method,
        headers: {
            ...req.headers,
            host: `${BACKEND_HOST}:${BACKEND_PORT}`,
        },
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
        console.error('[Proxy Error]', err.message);
        res.status(502).json({ error: 'Backend tidak dapat dijangkau' });
    });

    req.pipe(proxyReq, { end: true });
});

// 2. Serve static assets dari folder dist hasil build Vite
app.use(express.static(path.join(__dirname, 'dist')));

// 3. Fallback ke index.html untuk semua route React Router (SPA)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Frontend server running on http://0.0.0.0:${PORT}`);
    console.log(`API requests proxied to http://${BACKEND_HOST}:${BACKEND_PORT}`);
});
