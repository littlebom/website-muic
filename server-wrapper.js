const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { parse } = require('url');

const PORT = 3000;
const NEXT_PORT = 3001;
const HOST = '0.0.0.0';

console.log(`> Starting Next.js on port ${NEXT_PORT}...`);

// Spawn Next.js as a child process
const nextApp = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: NEXT_PORT.toString() }
});

nextApp.stdout.on('data', (data) => {
    process.stdout.write(`[Next.js] ${data}`);
});

nextApp.stderr.on('data', (data) => {
    process.stderr.write(`[Next.js] ${data}`);
});

nextApp.on('close', (code) => {
    console.log(`Next.js process exited with code ${code}`);
    process.exit(code);
});

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.txt': 'text/plain',
};

function serveFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.statusCode = 500;
            res.end('Internal Server Error');
            return;
        }
        res.setHeader('Content-Type', contentType);
        if (filePath.includes('.next/static')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        }
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    // 1. Handle .next/static files
    if (pathname.startsWith('/_next/static/')) {
        const filePath = path.join(__dirname, '.next', 'static', pathname.replace('/_next/static/', ''));
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            return serveFile(filePath, res);
        }
    }

    // 2. Handle /public files (including uploads)
    const publicFilePath = path.join(__dirname, 'public', pathname);
    if (fs.existsSync(publicFilePath) && fs.statSync(publicFilePath).isFile()) {
        return serveFile(publicFilePath, res);
    }

    // 3. Proxy to Next.js for everything else
    const proxyReq = http.request({
        host: 'localhost',
        port: NEXT_PORT,
        path: req.url,
        method: req.method,
        headers: req.headers
    }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
            res.statusCode = 503;
            res.end('Service Unavailable - Next.js is starting up...');
        } else {
            console.error('Proxy error:', err);
            res.statusCode = 502;
            res.end('Bad Gateway');
        }
    });

    req.pipe(proxyReq);
});

server.listen(PORT, HOST, () => {
    console.log(`> Wrapper listening on http://${HOST}:${PORT}`);
    console.log(`> Handling static files and proxying to Next.js on port ${NEXT_PORT}`);
});
