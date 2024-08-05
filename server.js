const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create HTTP server to serve the static files (HTML, JS, CSS)
const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                fs.readFile('./404.html', (error, content) => {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            } else {
                res.writeHead(500);
                res.end('Sorry, there was an error: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Create WebSocket server on top of HTTP server
const wss = new WebSocket.Server({ server });

let totalConnections = 0;
let activeUsers = 0;
let checkboxState = new Array(100000).fill(false);

const userActionLimits = {}; // Store user actions count and timestamps

wss.on('connection', (ws) => {
    totalConnections++;
    activeUsers++;
    broadcastStats();

    // Send initial checkbox state to new connection
    ws.send(JSON.stringify(checkboxState));
    ws.send(JSON.stringify({ totalConnections, activeUsers }));

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        const userId = ws._socket.remoteAddress; // Example user identifier
        const currentTime = Date.now();

        if (!userActionLimits[userId]) {
            userActionLimits[userId] = { count: 0, lastActionTime: currentTime };
        }

        const timeSinceLastAction = currentTime - userActionLimits[userId].lastActionTime;

        if (timeSinceLastAction > 1000) { // Reset count after 1 second
            userActionLimits[userId].count = 0;
            userActionLimits[userId].lastActionTime = currentTime;
        }

        if (userActionLimits[userId].count >= 5) {
            ws.send(JSON.stringify({ error: "Rate limit exceeded" }));
            return;
        }

        userActionLimits[userId].count += 1;

        if (data.index !== undefined && data.checked !== undefined) {
            checkboxState[data.index] = data.checked;
            broadcastCheckboxState(data);
        }
    });

    ws.on('close', () => {
        activeUsers--;
        broadcastStats();
    });
});

function broadcastStats() {
    const stats = { totalConnections, activeUsers };
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(stats));
        }
    });
}

function broadcastCheckboxState(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Listen on port 8080
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
