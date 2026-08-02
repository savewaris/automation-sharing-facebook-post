const { log, sleep, randomSleep } = require('./utils');

class GroupDiscovery {
    constructor(browserManager) {
        this.bm = browserManager;
    }

    // Extract all Facebook groups the user has joined
    async getJoinedGroups(onLog) {
        let tempContext = false;
        try {
            if (!this.bm.context) {
                await this.bm.initContext({ headless: true });
                tempContext = true;
            }

            log(onLog, 'Navigating to Facebook Joined Groups page...');
            await this.bm.page.goto('https://www.facebook.com/groups/joins/', { waitUntil: 'domcontentloaded', timeout: 30000 });
            await randomSleep(3, 5);

            log(onLog, 'Scanning joined group list from DOM...');

            // Scroll down to load all joined groups
            for (let i = 0; i < 6; i++) {
                await this.bm.page.evaluate(() => window.scrollBy(0, 1200));
                await sleep(1500);
            }

            const groups = await this.bm.page.evaluate(() => {
                const groupElements = Array.from(document.querySelectorAll('a[href*="/groups/"]'));
                const uniqueMap = new Map();

                groupElements.forEach((el) => {
                    const href = el.getAttribute('href') || '';
                    const text = el.innerText ? el.innerText.trim() : '';

                    // Match group link pattern
                    const match = href.match(/\/groups\/([0-9a-zA-Z._-]+)/);
                    if (match && text && !['joins', 'feed', 'create', 'discover', 'category'].includes(match[1])) {
                        const groupId = match[1];
                        if (!uniqueMap.has(groupId) && text.length > 1) {
                            uniqueMap.set(groupId, {
                                id: groupId,
                                name: text.split('\n')[0],
                                url: `https://www.facebook.com/groups/${groupId}/`
                            });
                        }
                    }
                });

                return Array.from(uniqueMap.values());
            });

            log(onLog, `Successfully discovered ${groups.length} joined groups.`, 'success');
            return groups;
        } catch (err) {
            log(onLog, `Error discovering joined groups: ${err.message}`, 'error');
            return [];
        } finally {
            if (tempContext) {
                await this.bm.closeContext();
            }
        }
    }
}

module.exports = GroupDiscovery;
