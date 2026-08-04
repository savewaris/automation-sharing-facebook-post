const { EventEmitter } = require('events');
const BrowserManager = require('./browser');
const AuthManager = require('./auth');
const GroupDiscovery = require('./discovery');
const PostSharingManager = require('./sharing');
const HistoryManager = require('./history');
const { log } = require('./utils');

// Unified Facebook Automation Core Engine
class FacebookCore extends EventEmitter {
    constructor(options = {}) {
        super();
        this.browserManager = new BrowserManager(options);
        this.authManager = new AuthManager(this.browserManager);
        this.groupDiscovery = new GroupDiscovery(this.browserManager);
        this.historyManager = new HistoryManager(this.browserManager.userDataDir);
        this.sharingManager = new PostSharingManager(this.browserManager, this.historyManager);
    }

    // Create a logger handler that emits 'log' event and calls optional onLog callback
    createLogHandler(onLog) {
        return (logObj) => {
            this.emit('log', logObj);
            if (typeof onLog === 'function') {
                onLog(logObj);
            }
        };
    }

    // Check FB Login status
    async checkAuthStatus(onLog) {
        return await this.authManager.checkAuthStatus(this.createLogHandler(onLog));
    }

    // Launch visible browser window for user login
    async launchLoginBrowser(onLog) {
        return await this.authManager.launchLoginBrowser(this.createLogHandler(onLog));
    }

    // Discover joined groups
    async getJoinedGroups(onLog) {
        return await this.groupDiscovery.getJoinedGroups(this.createLogHandler(onLog));
    }

    // Automate sharing post to groups
    async sharePostToGroups(params, onLog) {
        return await this.sharingManager.sharePostToGroups(params, this.createLogHandler(onLog));
    }

    // Request abort for running sharing task
    abortTask(onLog) {
        this.browserManager.abortRequested = true;
        log(this.createLogHandler(onLog), 'Abort signal sent to active task...', 'warn');
    }
}

module.exports = FacebookCore;
