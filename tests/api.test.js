const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer, connectWebSocket, makeHttpRequest, cleanup } = require('./helpers');

const TEST_PORT = 3002;

test.describe('Facebook Automation REST API Endpoints Suite', () => {
    let serverProcess;
    let wsClient;
    const logsReceived = [];

    test.before(async () => {
        serverProcess = await startServer(TEST_PORT);
        wsClient = await connectWebSocket(logsReceived, TEST_PORT);
        await new Promise(r => setTimeout(r, 500));
    });

    test.after(() => {
        cleanup(serverProcess, wsClient);
    });

    test('GET /api/status - Should return Facebook authentication status', async () => {
        const response = await makeHttpRequest('/api/status', 'GET', null, TEST_PORT);
        assert.strictEqual(typeof response.isLoggedIn, 'boolean');
        assert.ok(response.userDataDir, 'Response should include userDataDir path');

        // Give event emitter time to stream log over WS
        await new Promise(r => setTimeout(r, 500));

        const authLog = logsReceived.find(l => l.message && l.message.includes('Checking Facebook login status'));
        assert.ok(authLog, 'Auth check operation log should be streamed over WebSocket');
    });

    test('POST /api/share - Should validate required postUrl body parameter', async () => {
        const response = await makeHttpRequest('/api/share', 'POST', {}, TEST_PORT);
        assert.strictEqual(response.success, false);
        assert.strictEqual(response.error, 'postUrl is required');
    });

    test('POST /api/stop - Should send abort signal to active task', async () => {
        const response = await makeHttpRequest('/api/stop', 'POST', null, TEST_PORT);
        assert.strictEqual(response.success, true);
        assert.strictEqual(response.message, 'Abort signal sent to active task.');

        // Give event emitter time to stream log over WS
        await new Promise(r => setTimeout(r, 500));

        const abortLog = logsReceived.find(l => l.message && l.message.includes('Abort signal sent'));
        assert.ok(abortLog, 'Abort signal warn log should be streamed over WebSocket');
    });
});
