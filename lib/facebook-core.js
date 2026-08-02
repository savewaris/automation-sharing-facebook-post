const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Reusable Facebook Automation Engine

class FacebookEngine {
    constructor(option = {}) {
        // Path where Chrome session cookies & login data will be saved
        this.userDataDir = option.userDataDir || path.join(process.cwd(), 'user_data', 'chrome_profile');
        this.context = null;
        this.page = null;
        this.isTaskRunning = false;
        this.abortRequested = false;

        // Create user data directory if it doesn't exist yet
        if (!fs.existsSync(this.userDataDir)) {
            fs.mkdirSync(this.userDataDir, { recursive: true });
        }
    }

    // Helper: Log formatted messages to console or UI callback
    log(onLog, message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const formatted = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
        if (onLog && typeof onLog === 'function') {
            onLog({ timestamp, message, type, formatted });
        } else {
            console.log(formatted);
        }
    }

    // Helper: Human-like random delay
    async sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async randomSleep(minSec = 2, maxSec = 5) {
            const ms = Math.floor(Math.random() * (maxSec - minSec + 1) + minSec) * 1000;
            await this.sleep(ms);
        }
        // Helper: Human-like text typing simulation
    async humanType(element, text) {
        for (const char of text) {
            await element.type(char, { delay: Math.floor(Math.random() * 80) + 30 });
        }
    }
}
module.exports = FacebookEngine;