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

            let userId = null;
            let profileUrl = null;
            let accountName = null;
            let username = null;
            let avatarUrl = null;

            if (!isLoggedOut) {
                const cookies = await this.bm.context.cookies('https://www.facebook.com');
                const cUserCookie = cookies.find(c => c.name === 'c_user');
                if (cUserCookie) {
                    userId = cUserCookie.value;
                }

                try {
                    await this.bm.page.goto('https://www.facebook.com/me', { waitUntil: 'domcontentloaded', timeout: 15000 });
                    profileUrl = this.bm.page.url();
                    
                    if (profileUrl.includes('facebook.com/')) {
                        const handle = profileUrl.split('facebook.com/')[1]?.split('?')[0]?.replace(/\/$/, '');
                        if (handle && !handle.includes('profile.php')) {
                            username = '@' + handle;
                            // Clean handle into readable Full Name format (e.g. waris.man.9803 -> Waris Man)
                            const cleanParts = handle.replace(/\.\d+$/, '').split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1));
                            accountName = cleanParts.join(' ');
                        }
                    }

                    const title = await this.bm.page.title();
                    if (!accountName && title && title !== 'Facebook' && !title.includes('Chats')) {
                        accountName = title.replace(/\s*\|.*$/, '').replace(/^\(\d+\)\s*/, '').trim();
                    }

                    // Extract Avatar Image URL
                    const avatarImgs = await this.bm.page.$$('svg image, img[alt*="profile"], img[alt*="Profile"], img[src*="scontent"]');
                    for (const img of avatarImgs) {
                        const src = await img.getAttribute('src').catch(() => null) || await img.getAttribute('xlink:href').catch(() => null);
                        if (src && src.includes('scontent')) {
                            avatarUrl = src;
                            break;
                        }
                    }
                } catch (e) {
                    profileUrl = userId ? `https://www.facebook.com/profile.php?id=${userId}` : 'https://www.facebook.com/me';
                }
            }

            const status = {
                isLoggedIn: !isLoggedOut,
                fullName: accountName || (userId ? `Facebook User` : null),
                username: username || (userId ? `@user_${userId}` : null),
                userId,
                profileUrl: profileUrl || `https://www.facebook.com/profile.php?id=${userId}`,
                avatarUrl: avatarUrl || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png',
                currentUrl,
                userDataDir: this.bm.userDataDir
            };

            if (!isLoggedOut) {
                log(onLog, `Facebook session ACTIVE: ${status.fullName} (${status.username} | ID: ${userId})`, 'success');
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
