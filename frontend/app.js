/**
 * Application Main Controller Entry Point (ES Module)
 */
import { initWebSocket } from './js/websocket.js';
import { appendLog, initTerminal } from './js/terminal.js';
import { setGroups, getSelectedGroups, initGroupSearch } from './js/groups.js';
import * as api from './js/api.js';

const wsDot = document.getElementById('wsDot');
const wsStatusText = document.getElementById('wsStatusText');
const sessionResult = document.getElementById('sessionResult');
const presetSelect = document.getElementById('presetSelect');
const historyCard = document.getElementById('historyCard');
const historyTableBody = document.getElementById('historyTableBody');

let presetsData = [];

// Initialize Terminal & Group Search listeners
initTerminal();
initGroupSearch();

// Initialize WebSocket Client
initWebSocket(
    (logData) => appendLog(logData),
    (isOnline) => {
        if (isOnline) {
            wsDot.classList.add('online');
            wsStatusText.textContent = 'WS Online';
        } else {
            wsDot.classList.remove('online');
            wsStatusText.textContent = 'WS Offline (Reconnecting...)';
        }
    }
);

// Function to check and render Facebook session status
async function checkAndDisplaySession() {
    sessionResult.style.display = 'block';
    sessionResult.textContent = 'Checking session status...';
    try {
        const data = await api.checkStatus();
        if (data.isLoggedIn) {
            sessionResult.innerHTML = `
                <div style="display: flex; align-items: center; gap: 16px; background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(99, 102, 241, 0.35); padding: 14px; border-radius: 12px; margin-top: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                    <img src="${data.avatarUrl}" alt="Profile Avatar" onerror="this.src='https://via.placeholder.com/52'" style="width: 52px; height: 52px; border-radius: 50%; object-fit: cover; border: 2px solid #6366f1;">
                    <div style="flex: 1;">
                        <div style="font-size: 1.05rem; font-weight: 700; color: #ffffff; display: flex; align-items: center; gap: 8px;">
                            ${data.fullName || 'Facebook Account'}
                            <span style="font-size: 0.75rem; background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.4); padding: 2px 8px; border-radius: 12px; font-weight: 500;">Active</span>
                        </div>
                        <div style="font-size: 0.85rem; color: #a5b4fc; margin-top: 2px;">
                            ${data.username || ''} • User ID: <code style="color: #f3f4f6; font-family: monospace;">${data.userId || 'N/A'}</code>
                        </div>
                    </div>
                    <div>
                        <a href="${data.profileUrl}" target="_blank" style="display: inline-block; background: #6366f1; color: #ffffff; padding: 8px 16px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; text-decoration: none;">View Profile ↗</a>
                    </div>
                </div>
            `;
        } else {
            sessionResult.innerHTML = `
                <div style="padding: 12px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; color: #fca5a5;">
                    ❌ <strong>Status: Logged Out</strong> — Please click "Launch Chrome Login Window" to authenticate.
                </div>
            `;
        }
    } catch (err) {
        sessionResult.textContent = `Error checking session: ${err.message}`;
    }
}

// Session Status Check Button
document.getElementById('btnStatus').addEventListener('click', checkAndDisplaySession);

// Auto-check on page load
checkAndDisplaySession();

// Launch Login Window
document.getElementById('btnLogin').addEventListener('click', async () => {
    try {
        await api.launchLogin();
    } catch (err) {
        alert(`Error launching login window: ${err.message}`);
    }
});

// Extract Groups
document.getElementById('btnGroups').addEventListener('click', async () => {
    try {
        const data = await api.fetchGroups();
        setGroups(data.groups || []);
    } catch (err) {
        alert(`Error extracting groups: ${err.message}`);
    }
});

// Preset Management
async function loadPresets() {
    try {
        const data = await api.getPresets();
        if (data.presets) {
            presetsData = data.presets;
            presetSelect.innerHTML = '<option value="">-- Load Group Preset --</option>' +
                presetsData.map(p => `<option value="${p.id}">${p.name} (${p.groups.length} groups)</option>`).join('');
        }
    } catch (e) {}
}

presetSelect.addEventListener('change', () => {
    const selectedId = presetSelect.value;
    if (!selectedId) return;
    const preset = presetsData.find(p => p.id === selectedId);
    if (preset && preset.groups) {
        setGroups(preset.groups);
    }
});

document.getElementById('btnSavePreset').addEventListener('click', async () => {
    const selectedGroups = getSelectedGroups();
    if (selectedGroups.length === 0) {
        alert('Please select at least one group to save into a preset!');
        return;
    }
    const presetName = prompt('Enter a name for this Group Preset (e.g. "Tech Groups"):');
    if (!presetName) return;

    const groupsPayload = selectedGroups.map(g => ({
        url: g.url,
        id: g.id || '',
        name: g.name
    }));

    try {
        const data = await api.savePreset(presetName, groupsPayload);
        if (data.success) {
            alert(`Preset "${presetName}" saved successfully!`);
            loadPresets();
        }
    } catch (err) {
        alert(`Error saving preset: ${err.message}`);
    }
});

document.getElementById('btnDeletePreset').addEventListener('click', async () => {
    const selectedId = presetSelect.value;
    if (!selectedId) {
        alert('Select a preset from the dropdown to delete!');
        return;
    }
    if (!confirm('Are you sure you want to delete this preset?')) return;
    try {
        await api.deletePreset(selectedId);
        loadPresets();
        alert('Preset deleted.');
    } catch (err) {
        alert(`Error deleting preset: ${err.message}`);
    }
});

// Start Sharing Task
document.getElementById('btnShare').addEventListener('click', async () => {
    const postUrl = document.getElementById('postUrl').value.trim();
    const customMessage = document.getElementById('customMessage').value.trim();
    const dryRun = document.getElementById('chkDryRun').checked;
    const cooldownDays = parseInt(document.getElementById('cooldownDays').value, 10) || 7;
    const allowDuplicate = document.getElementById('chkAllowDuplicate').checked;

    if (!postUrl) {
        alert('Please enter a Facebook Post URL!');
        return;
    }

    const selectedGroups = getSelectedGroups().map(g => ({
        url: g.url,
        id: g.id || '',
        name: g.name
    }));

    if (selectedGroups.length === 0) {
        alert('Please select at least one target Facebook group!');
        return;
    }

    try {
        const data = await api.startSharing({
            postUrl,
            customMessage,
            targetGroups: selectedGroups,
            dryRun,
            cooldownDays,
            allowDuplicate
        });
        alert(data.message);
    } catch (err) {
        alert(`Error starting sharing task: ${err.message}`);
    }
});

// Abort Active Task
document.getElementById('btnStop').addEventListener('click', async () => {
    try {
        const data = await api.stopSharing();
        alert(data.message);
    } catch (err) {
        alert(`Error stopping task: ${err.message}`);
    }
});

// View Share History
document.getElementById('btnViewHistory').addEventListener('click', async () => {
    historyCard.style.display = 'block';
    try {
        const data = await api.getHistory();
        if (data.history && data.history.length > 0) {
            historyTableBody.innerHTML = data.history.slice(-50).reverse().map(h => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 0.5rem; font-family: monospace;">${new Date(h.timestamp).toLocaleString()}</td>
                    <td style="padding: 0.5rem;"><strong>${h.groupName || h.groupId}</strong></td>
                    <td style="padding: 0.5rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <a href="${h.postUrl}" target="_blank" style="color: var(--primary);">${h.postUrl}</a>
                    </td>
                    <td style="padding: 0.5rem;">
                        <span class="log-type ${h.status === 'success' || h.status === 'dry_run_success' ? 'success' : (h.status === 'skipped' ? 'warn' : 'error')}">
                            ${h.status}
                        </span>
                    </td>
                    <td style="padding: 0.5rem;">${h.dryRun ? '🧪 Dry Run' : '⚡ Live'}</td>
                </tr>
            `).join('');
        } else {
            historyTableBody.innerHTML = '<tr><td colspan="5" style="padding: 1rem; text-align: center; color: var(--text-muted);">No history recorded yet.</td></tr>';
        }
    } catch (err) {
        alert(`Error fetching history: ${err.message}`);
    }
});

document.getElementById('btnCloseHistory').addEventListener('click', () => {
    historyCard.style.display = 'none';
});

// Initialize on page load
loadPresets();
