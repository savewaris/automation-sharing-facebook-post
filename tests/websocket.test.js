const test = require('node:test');
const assert = require('node:assert/strict');
const WebSocket = require('ws');
const { startServer, connectWebSocket, cleanup } = require('./helpers');

const TEST_PORT = 3001;

test.describe('WebSocket Stream & Handshake Integration Tests', () => {
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

    test('WebSocket client should connect and receive initial welcome handshake', () => {
        assert.strictEqual(wsClient.readyState, WebSocket.OPEN, 'WebSocket client should be in OPEN state');

        const handshakeLog = logsReceived.find(l => l.message && l.message.includes('Connected to Facebook Automation'));
        assert.ok(handshakeLog, 'Handshake log message should be received over WebSocket');
        assert.strictEqual(handshakeLog.type, 'info');
    });

    test('WebSocket client should receive structured log JSON objects with timestamp, type, and message', () => {
        assert.ok(logsReceived.length > 0, 'Should have received at least 1 log message');
        const firstLog = logsReceived[0];
        assert.ok(firstLog.timestamp, 'Log object must contain timestamp');
        assert.ok(firstLog.type, 'Log object must contain type');
        assert.ok(firstLog.message, 'Log object must contain message');
    });
});
