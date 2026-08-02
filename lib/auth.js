const { log, sleep } = require('./utils');

class AuthManager {
    constructor(browserManager) {
        this.bm = browserManager;
    }

    // Check if Facebook session is currently authenticated
    async checkAuthStatus(onLog) {
        let tempContext = false;
        try {
            if (!this.bm.context) {
                await this.bm.initContext({ headless: true });
                tempContext = true;
            }

            log(onLog, 'Checking Facebook login status...');
            await this.bm.page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
            await sleep(3000);

            const currentUrl = this.bm.page.url();
            const loginEmailInput = await this.bm.page.$('input[name="email"], input[id="email"]');
            const isLoggedOut = !!loginEmailInput || currentUrl.includes('/login');

            const status = {
                isLoggedIn: !isLoggedOut,
                currentUrl,
                userDataDir: this.bm.userDataDir
            };

            if (!isLoggedOut) {
                log(onLog, 'Facebook session is ACTIVE and logged in.', 'success');
            } else {
                log(onLog, 'Facebook session is NOT logged in. Please launch login browser.', 'warn');
            }
            return status;
        } catch (err) {
            log(onLog, `Error checking auth status: ${err.message}`, 'error');
            return { isLoggedIn: false, error: err.message };
        } finally {
            if (tempContext) {
                await this.bm.closeContext();
            }
        }
    }

    // Launch a visible browser window for one-time manual user login
    async launchLoginBrowser(onLog) {
        log(onLog, 'Launching visible Chrome window for Facebook login...');
        await this.bm.initContext({ headless: false });

        await this.bm.page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded' });
        log(onLog, 'Please log into Facebook in the opened browser window.', 'important');

        return new Promise((resolve) => {
            const checkInterval = setInterval(async () => {
                try {
                    if (!this.bm.context || this.bm.page.isClosed()) {
                        clearInterval(checkInterval);
                        log(onLog, 'Login browser window closed.', 'info');
                        resolve({ success: true, message: 'Browser session saved successfully.' });
                    } else {
                        const currentUrl = this.bm.page.url();
                        const loginEmailInput = await this.bm.page.$('input[name="email"]');
                        if (!loginEmailInput && currentUrl.includes('facebook.com') && !currentUrl.includes('/login')) {
                            log(onLog, 'Login detected! Session cookies saved to profile.', 'success');
                        }
                    }
                } catch (e) {
                    clearInterval(checkInterval);
                    resolve({ success: true, message: 'Session setup finished.' });
                }
            }, 3000);
        });
    }
}

module.exports = AuthManager;