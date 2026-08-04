const { log, sleep, randomSleep, humanType } = require('./utils');

class PostSharingManager {
    constructor(browserManager, historyManager) {
        this.bm = browserManager;
        this.hm = historyManager;
    }

    // Automate sharing a post/link to a list of target Facebook groups
    async sharePostToGroups({ postUrl, targetGroups = [], customMessage = '', minDelaySec = 10, maxDelaySec = 30, dryRun = false, cooldownDays = 7, allowDuplicate = false }, onLog) {
        if (!targetGroups || targetGroups.length === 0) {
            log(onLog, 'No target groups provided for post sharing.', 'warn');
            return { success: false, error: 'No target groups specified' };
        }

        let tempContext = false;
        let successCount = 0;
        let failedCount = 0;
        let skippedCount = 0;
        this.bm.isTaskRunning = true;
        this.bm.abortRequested = false;

        try {
            if (!this.bm.context) {
                // Using non-headless browser context for posting helps prevent FB anti-bot flags
                await this.bm.initContext({ headless: false });
                tempContext = true;
            }

            const modeLabel = dryRun ? ' [TEST / DRY-RUN MODE]' : '';
            log(onLog, `Starting automated post sharing to ${targetGroups.length} groups${modeLabel}...`, 'info');

            for (let i = 0; i < targetGroups.length; i++) {
                if (this.bm.abortRequested) {
                    log(onLog, 'Post sharing task was aborted by user.', 'warn');
                    break;
                }

                const group = targetGroups[i];
                const groupId = group.id || (typeof group === 'string' ? group : '');
                const groupUrl = typeof group === 'string' ? group : (group.url || `https://www.facebook.com/groups/${group.id}/`);
                const groupName = group.name || groupUrl;

                // Anti-spam de-duplication check
                if (this.hm && !allowDuplicate && groupId) {
                    const recentlyShared = this.hm.isRecentlyShared(postUrl, groupId, cooldownDays);
                    if (recentlyShared) {
                        log(onLog, `[SKIP] Group "${groupName}" was already posted to within the last ${cooldownDays} days. Skipping to prevent spam flags.`, 'warn');
                        skippedCount++;
                        if (this.hm) {
                            this.hm.addHistoryRecord({
                                postUrl,
                                groupId,
                                groupName,
                                status: 'skipped',
                                dryRun,
                                message: `Skipped due to ${cooldownDays}-day anti-spam cooldown.`
                            });
                        }
                        continue;
                    }
                }

                log(onLog, `[${i + 1}/${targetGroups.length}] Navigating to group: ${groupName}...`);

                try {
                    await this.bm.page.goto(groupUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
                    await randomSleep(3, 6);

                    // Selector for Facebook group post creation box
                    const composerSelector = 'div[role="button"]:has-text("Write something..."), div[role="button"]:has-text("Viết gì đó..."), div[aria-label*="Create a public post"], div[aria-label*="Tạo bài viết"]';
                    
                    log(onLog, `Opening post composer in group: ${groupName}...`);
                    const composerButton = await this.bm.page.$(composerSelector);

                    if (composerButton) {
                        await composerButton.click();
                        await sleep(2000);

                        // Locate active editable post textbox
                        const textboxSelector = 'div[role="textbox"][contenteditable="true"]';
                        await this.bm.page.waitForSelector(textboxSelector, { timeout: 10000 });
                        const textbox = await this.bm.page.$(textboxSelector);

                        if (textbox) {
                            // Type message content if provided
                            if (customMessage) {
                                log(onLog, 'Typing post message content...');
                                await humanType(textbox, customMessage + '\n\n');
                            }

                            // Type post URL to generate Facebook link preview card
                            log(onLog, `Adding post URL link preview: ${postUrl}`);
                            await humanType(textbox, postUrl);
                            await sleep(4000); // Wait for link preview to resolve

                            if (dryRun) {
                                log(onLog, `[DRY-RUN] Post content & preview generated successfully for ${groupName}. Skipping final submit.`, 'important');
                                successCount++;
                                if (this.hm) {
                                    this.hm.addHistoryRecord({
                                        postUrl,
                                        groupId,
                                        groupName,
                                        status: 'dry_run_success',
                                        dryRun: true,
                                        message: 'Simulated post successfully without publishing.'
                                    });
                                }
                                await sleep(3000);
                            } else {
                                // Click Post / Đăng button
                                const postBtnSelector = 'div[aria-label="Post"], div[aria-label="Đăng"], div[role="button"]:has-text("Post"), div[role="button"]:has-text("Đăng")';
                                const postBtn = await this.bm.page.$(postBtnSelector);

                                if (postBtn) {
                                    await postBtn.click();
                                    log(onLog, `Successfully posted to group: ${groupName}`, 'success');
                                    successCount++;
                                    if (this.hm) {
                                        this.hm.addHistoryRecord({
                                            postUrl,
                                            groupId,
                                            groupName,
                                            status: 'success',
                                            dryRun: false,
                                            message: 'Published successfully.'
                                        });
                                    }
                                    await sleep(5000);
                                } else {
                                    log(onLog, `Could not find Post submit button for group: ${groupName}`, 'error');
                                    failedCount++;
                                    if (this.hm) {
                                        this.hm.addHistoryRecord({
                                            postUrl,
                                            groupId,
                                            groupName,
                                            status: 'failed',
                                            dryRun: false,
                                            message: 'Post button selector not found.'
                                        });
                                    }
                                }
                            }
                        } else {
                            log(onLog, `Could not focus post textbox in group: ${groupName}`, 'error');
                            failedCount++;
                        }
                    } else {
                        log(onLog, `Post composer not found or group posting restricted: ${groupName}`, 'warn');
                        failedCount++;
                    }
                } catch (groupErr) {
                    log(onLog, `Failed sharing to ${groupName}: ${groupErr.message}`, 'error');
                    failedCount++;
                }

                // Random delay between group posts to protect account from rate-limiting / ban
                if (i < targetGroups.length - 1 && !this.bm.abortRequested) {
                    log(onLog, `Waiting delay before next group post (${minDelaySec}-${maxDelaySec}s)...`);
                    await randomSleep(minDelaySec, maxDelaySec);
                }
            }

            log(onLog, `Sharing task finished! Total: ${targetGroups.length}, Success: ${successCount}, Failed: ${failedCount}, Skipped: ${skippedCount}`, 'important');
            return { success: true, total: targetGroups.length, successCount, failedCount, skippedCount };
        } catch (err) {
            log(onLog, `Critical error in post sharing process: ${err.message}`, 'error');
            return { success: false, error: err.message };
        } finally {
            this.bm.isTaskRunning = false;
            if (tempContext) {
                await this.bm.closeContext();
            }
        }
    }
}

module.exports = PostSharingManager;
