const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');

/**
 * Helper: Make HTTP request to local backend server
 */
function makeHttpRequest(urlPath, method = 'GET', body = null, port = 3000) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port,
            path: urlPath,
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

/**
 * Helper: Spawn backend server process on specific port
 */
function startServer(port = 3000) {
    return new Promise((resolve, reject) => {
        const env = { ...process.env, PORT: port.toString() };
        const serverProcess = spawn('node', ['index.js'], { cwd: PROJECT_ROOT, env });
        const timer = setTimeout(() => reject(new Error(`Server start timeout on port ${port}`)), 10000);

        serverProcess.stdout.on('data', (data) => {
            if (data.toString().includes('Facebook Automation Server running')) {
                clearTimeout(timer);
                resolve(serverProcess);
            }
        });
        serverProcess.stderr.on('data', (data) => {
            console.error(`[SERVER STDERR:${port}] ${data.toString()}`);
        });
    });
}

/**
 * Helper: Connect WebSocket client and push received logs into target array
 */
function connectWebSocket(logsArray = [], port = 3000) {
    return new Promise((resolve, reject) => {
        const wsUrl = `ws://localhost:${port}/ws/logs`;
        const wsClient = new WebSocket(wsUrl);
        const timer = setTimeout(() => reject(new Error('WebSocket connect timeout')), 5000);

        wsClient.on('open', () => {
            clearTimeout(timer);
            resolve(wsClient);
        });

        wsClient.on('message', (data) => {
            try {
                logsArray.push(JSON.parse(data.toString()));
            } catch (e) {}
        });

        wsClient.on('error', reject);
    });
}

/**
 * Helper: Cleanup WS client and server process
 */
function cleanup(serverProcess, wsClient) {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        wsClient.close();
    }
    if (serverProcess) {
        serverProcess.kill();
    }
}

module.exports = {
    PROJECT_ROOT,
    makeHttpRequest,
    startServer,
    connectWebSocket,
    cleanup
};
