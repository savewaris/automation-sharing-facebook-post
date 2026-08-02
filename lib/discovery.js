const { log, sleep, randomSleep } = require('./utils');

class GroupDiscovery {
    constructor(browserManager) {
        this.bm = browserManager;
    }

    // Extract all Facebook groups the user has joined
    async getJoinedGroups(onLog) {
        try {
            if (!this.bm.context) {
                await this.bm.initContext({ headless: true });
            }

            log(onLog, 'Navigating to Facebook Joined Groups page...');
            await this.bm.page.goto('https://www.facebook.com/groups/joins/', { waitUntil: 'domcontentloaded', timeout: 30000 });
            await randomSleep(3, 5);

            log(onLog, 'Scanning joined group list from DOM...');

            for (let i = 0; i < 5; i++) {
                await this.bm.page.evaluate(() => window.scrollBy(0, 1000));
                await sleep(1500);
            }

            const groups = await this.bm.page.evaluate(() => {
                const groupElements = Array.from(document.querySelectorAll('a[href*="/groups/"]'));
                constuniqueMap = new Map();


            })
        } catch (e) {}
    }
}