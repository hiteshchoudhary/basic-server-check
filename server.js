const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    // Serve the HTML and JS files
    if (req.url === '/') {
      fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
        if (err) {
          res.writeHead(500);
          res.end('Error loading index.html');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        }
      });
    } else if (req.url === '/script.js') {
      fs.readFile(path.join(__dirname, 'script.js'), (err, data) => {
        if (err) {
          res.writeHead(500);
          res.end('Error loading script.js');
        } else {
          res.writeHead(200, { 'Content-Type': 'application/javascript' });
          res.end(data);
        }
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  }
});

const wss = new WebSocket.Server({ server });

let checkboxState = new Array(100000).fill(false);

wss.on('connection', ws => {
  ws.send(JSON.stringify(checkboxState)); // Send initial state to new connection

  ws.on('message', message => {
    const { index, checked } = JSON.parse(message);
    checkboxState[index] = checked;

    // Broadcast the update to all connected clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ index, checked }));
      }
    });
  });
});

server.listen(8080, () => {
  console.log('Server is listening on http://localhost:8080');
});
