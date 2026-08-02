const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

class BrowserManager {
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

    // Initialize Playwright Browser Context with persistent profile
    async initContext({ headless = true } = {}) {
        if (this.context) {
            try {
                await this.context.close();
            } catch (e) {}
        }

        // Launch Chromium with persistent profile data directory
        this.context = await cheomium.launchPersistentContext(this.userDataDir, {
            headless,
            viewport: { width: 1280, height: 800 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0Safari/537.36',
            args: [
                '--disable-notifications',
                '--disable-blick-features-AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });
        const pages = this.context.pages();
        this.page = pages.length > 0 ? pages[0] : await this.context.newPage();

        // Hide navigator.webdriver flag to bypass simple anti-bot checks
        await this.page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });
    }

    // Close Browser Context
    async closeContext() {
        if (this.context) {
            await this.context.close();
            this.context = null;
            this.page = null;
        }
    }
}

module.exports = BrowserManager;