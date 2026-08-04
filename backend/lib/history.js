const fs = require('fs');
const path = require('path');

class HistoryManager {
    constructor(userDataDir) {
        this.userDataDir = userDataDir || path.join(process.cwd(), 'user_data');
        this.historyFile = path.join(this.userDataDir, 'share_history.json');
        this.presetsFile = path.join(this.userDataDir, 'group_presets.json');
        this.ensureFilesExist();
    }

    ensureFilesExist() {
        if (!fs.existsSync(this.userDataDir)) {
            fs.mkdirSync(this.userDataDir, { recursive: true });
        }
        if (!fs.existsSync(this.historyFile)) {
            fs.writeFileSync(this.historyFile, JSON.stringify([], null, 2));
        }
        if (!fs.existsSync(this.presetsFile)) {
            fs.writeFileSync(this.presetsFile, JSON.stringify([], null, 2));
        }
    }

    getHistory() {
        try {
            const data = fs.readFileSync(this.historyFile, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }

    addHistoryRecord(record) {
        const history = this.getHistory();
        const newRecord = {
            id: Date.now().toString(),
            postUrl: record.postUrl,
            groupId: record.groupId,
            groupName: record.groupName,
            timestamp: new Date().toISOString(),
            status: record.status || 'success',
            dryRun: !!record.dryRun,
            message: record.message || ''
        };
        history.push(newRecord);
        fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
        return newRecord;
    }

    // Check if postUrl was shared to groupId within cooldownDays
    isRecentlyShared(postUrl, groupId, cooldownDays = 7) {
        const history = this.getHistory();
        const cutoffTime = Date.now() - (cooldownDays * 24 * 60 * 60 * 1000);

        return history.some(item => {
            if (item.status !== 'success') return false;
            if (item.postUrl !== postUrl || item.groupId !== groupId) return false;
            const itemTime = new Date(item.timestamp).getTime();
            return itemTime >= cutoffTime;
        });
    }

    getPresets() {
        try {
            const data = fs.readFileSync(this.presetsFile, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }

    savePreset(name, groups) {
        const presets = this.getPresets();
        const existingIndex = presets.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
        const newPreset = {
            id: existingIndex >= 0 ? presets[existingIndex].id : Date.now().toString(),
            name,
            updatedAt: new Date().toISOString(),
            groups
        };
        if (existingIndex >= 0) {
            presets[existingIndex] = newPreset;
        } else {
            presets.push(newPreset);
        }
        fs.writeFileSync(this.presetsFile, JSON.stringify(presets, null, 2));
        return newPreset;
    }

    deletePreset(id) {
        let presets = this.getPresets();
        presets = presets.filter(p => p.id !== id && p.name !== id);
        fs.writeFileSync(this.presetsFile, JSON.stringify(presets, null, 2));
        return true;
    }
}

module.exports = HistoryManager;
