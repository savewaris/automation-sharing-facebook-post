/**
 * REST API Client Wrappers Module
 */

export async function checkStatus() {
    const res = await fetch('/api/status');
    return await res.json();
}

export async function launchLogin() {
    const res = await fetch('/api/login');
    return await res.json();
}

export async function fetchGroups() {
    const res = await fetch('/api/groups');
    return await res.json();
}

export async function getPresets() {
    const res = await fetch('/api/presets');
    return await res.json();
}

export async function savePreset(name, groups) {
    const res = await fetch('/api/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, groups })
    });
    return await res.json();
}

export async function deletePreset(id) {
    const res = await fetch(`/api/presets/${id}`, { method: 'DELETE' });
    return await res.json();
}

export async function getHistory() {
    const res = await fetch('/api/history');
    return await res.json();
}

export async function startSharing(data) {
    const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return await res.json();
}

export async function stopSharing() {
    const res = await fetch('/api/stop', { method: 'POST' });
    return await res.json();
}
