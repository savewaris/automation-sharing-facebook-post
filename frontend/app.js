// Frontend Web Dashboard Client Logic

const wsDot = document.getElementById('wsDot');
const wsStatusText = document.getElementById('wsStatusText');
const terminalBody = document.getElementById('terminalBody');
const sessionResult = document.getElementById('sessionResult');
const groupList = document.getElementById('groupList');

// WebSocket Connection Setup
const wsUrl = `ws://${window.location.host}/ws/logs`;
let ws;

function connectWS() {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        wsDot.classList.add('online');
        wsStatusText.textContent = 'WS Online';
    };

    ws.onclose = () => {
        wsDot.classList.remove('online');
        wsStatusText.textContent = 'WS Offline (Reconnecting...)';
        setTimeout(connectWS, 3000);
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            appendLog(data);
        } catch (e) {
            console.error("Malformed log message:", event.data);
        }
    };
}

function appendLog(log) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';

    const type = (log.type || 'info').toLowerCase();
    const timestamp = log.timestamp || new Date().toLocaleTimeString();

    entry.innerHTML = `
        <span class="log-time">[${timestamp}]</span>
        <span class="log-type ${type}">${type}</span>
        <span class="log-msg">${log.message || log}</span>
    `;

    terminalBody.appendChild(entry);
    terminalBody.scrollTop = terminalBody.scrollHeight;
}

document.getElementById('btnClearLogs').addEventListener('click', () => {
    terminalBody.innerHTML = '';
});

// REST API Request Event Handlers

// Check Auth Status
document.getElementById('btnStatus').addEventListener('click', async () => {
    sessionResult.style.display = 'block';
    sessionResult.textContent = 'Checking session status...';
    try {
        const res = await fetch('/api/status');
        const data = await res.json();
        sessionResult.innerHTML = `<strong>LoggedIn:</strong> ${data.isLoggedIn ? '✅ Active' : '❌ Logged Out'} | <strong>URL:</strong> ${data.currentUrl}`;
    } catch (err) {
        sessionResult.textContent = `Error: ${err.message}`;
    }
});

// Launch Login Window
document.getElementById('btnLogin').addEventListener('click', async () => {
    try {
        await fetch('/api/login');
    } catch (err) {
        alert(`Error launching login window: ${err.message}`);
    }
});

// Extract Groups
document.getElementById('btnGroups').addEventListener('click', async () => {
    groupList.innerHTML = '<div style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 1rem;">Extracting groups via Playwright...</div>';
    try {
        const res = await fetch('/api/groups');
        const data = await res.json();
        if (data.groups && data.groups.length > 0) {
            groupList.innerHTML = data.groups.map(g => `
                <div class="group-item">
                    <input type="checkbox" checked value="${g.url}" class="group-cb" />
                    <span><strong>${g.title || 'FB Group'}</strong> (${g.url})</span>
                </div>
            `).join('');
        } else {
            groupList.innerHTML = '<div style="font-size: 0.85rem; color: var(--accent-amber); text-align: center; padding: 1rem;">No groups found or not logged in.</div>';
        }
    } catch (err) {
        groupList.innerHTML = `<div style="font-size: 0.85rem; color: var(--accent-red); text-align: center; padding: 1rem;">Error: ${err.message}</div>`;
    }
});

// Start Sharing Task
document.getElementById('btnShare').addEventListener('click', async () => {
    const postUrl = document.getElementById('postUrl').value.trim();
    const customMessage = document.getElementById('customMessage').value.trim();

    if (!postUrl) {
        alert('Please enter a Facebook Post URL!');
        return;
    }

    const selectedGroups = Array.from(document.querySelectorAll('.group-cb:checked')).map(cb => cb.value);

    try {
        const res = await fetch('/api/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postUrl, customMessage, targetGroups: selectedGroups })
        });
        const data = await res.json();
        alert(data.message);
    } catch (err) {
        alert(`Error: ${err.message}`);
    }
});

// Abort Active Task
document.getElementById('btnStop').addEventListener('click', async () => {
    try {
        const res = await fetch('/api/stop', { method: 'POST' });
        const data = await res.json();
        alert(data.message);
    } catch (err) {
        alert(`Error: ${err.message}`);
    }
});

// Initialize WebSocket on page load
connectWS();
