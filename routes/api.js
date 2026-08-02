const express = require('express');

/**
 * Creates API router for Facebook Automation endpoints.
 * @param {import('../lib/facebook-core')} fbEngine 
 */
function createApiRouter(fbEngine) {
    const router = express.Router();

    // Helper to resolve fbEngine instance
    const getEngine = (req) => fbEngine || req.app.locals.fbEngine;

    // GET /api/status - Check Facebook session authentication status
    router.get('/status', async (req, res) => {
        try {
            const engine = getEngine(req);
            const result = await engine.checkAuthStatus();
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET /api/login - Launch visible browser window for manual user login
    router.get('/login', async (req, res) => {
        try {
            const engine = getEngine(req);
            const result = await engine.launchLoginBrowser();
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET /api/groups - Extract all Facebook groups joined by the logged-in user
    router.get('/groups', async (req, res) => {
        try {
            const engine = getEngine(req);
            const groups = await engine.getJoinedGroups();
            res.json({ success: true, count: groups.length, groups });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST /api/share - Trigger post sharing to target Facebook groups
    router.post('/share', async (req, res) => {
        const { postUrl, targetGroups, customMessage, minDelaySec, maxDelaySec } = req.body;

        if (!postUrl) {
            return res.status(400).json({ success: false, error: 'postUrl is required' });
        }

        const engine = getEngine(req);

        // Run sharing task in background, respond immediately
        engine.sharePostToGroups({
            postUrl,
            targetGroups,
            customMessage,
            minDelaySec: minDelaySec || 10,
            maxDelaySec: maxDelaySec || 30
        }).catch((err) => {
            engine.emit('log', {
                timestamp: new Date().toLocaleTimeString(),
                type: 'error',
                message: err.message
            });
        });

        res.json({ success: true, message: 'Post sharing task initiated in background.' });
    });

    // POST /api/stop - Abort currently running post sharing task
    router.post('/stop', (req, res) => {
        const engine = getEngine(req);
        engine.abortTask();
        res.json({ success: true, message: 'Abort signal sent to active task.' });
    });

    return router;
}

module.exports = createApiRouter;
