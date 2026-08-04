/**
 * Groups & Real-Time Search Module
 */
const groupList = document.getElementById('groupList');
const groupSearchInput = document.getElementById('groupSearchInput');
const groupCountBadge = document.getElementById('groupCountBadge');
const btnSelectAllFiltered = document.getElementById('btnSelectAllFiltered');
const btnDeselectAll = document.getElementById('btnDeselectAll');

let loadedGroups = [];

export function setGroups(rawGroups) {
    loadedGroups = (rawGroups || []).map(g => ({
        url: g.url || (typeof g === 'string' ? g : ''),
        name: g.name || g.title || (typeof g === 'string' ? g : 'FB Group'),
        id: g.id || '',
        selected: true
    }));
    renderGroups();
}

export function getLoadedGroups() {
    return loadedGroups;
}

export function getSelectedGroups() {
    return loadedGroups.filter(g => g.selected);
}

export function renderGroups() {
    if (!groupList) return;
    const searchTerm = (groupSearchInput.value || '').toLowerCase().trim();
    
    // Filter by search query
    const filteredGroups = loadedGroups.filter(g => 
        g.name.toLowerCase().includes(searchTerm) || 
        g.url.toLowerCase().includes(searchTerm)
    );

    const selectedCount = loadedGroups.filter(g => g.selected).length;
    if (groupCountBadge) {
        groupCountBadge.textContent = `${filteredGroups.length}/${loadedGroups.length} visible | ${selectedCount} selected`;
    }

    if (filteredGroups.length === 0) {
        if (loadedGroups.length === 0) {
            groupList.innerHTML = '<div style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 1rem;">No groups loaded yet.</div>';
        } else {
            groupList.innerHTML = `<div style="font-size: 0.85rem; color: var(--accent-amber); text-align: center; padding: 1rem;">No groups match "${groupSearchInput.value}".</div>`;
        }
        return;
    }

    groupList.innerHTML = filteredGroups.map(g => `
        <div class="group-item">
            <input type="checkbox" ${g.selected ? 'checked' : ''} data-url="${g.url}" class="group-cb" />
            <span><strong>${g.name}</strong> (${g.url})</span>
        </div>
    `).join('');

    // Attach checkbox toggle listeners to preserve selection state
    document.querySelectorAll('.group-cb').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const targetUrl = e.target.dataset.url;
            const targetItem = loadedGroups.find(g => g.url === targetUrl);
            if (targetItem) {
                targetItem.selected = e.target.checked;
                const selCount = loadedGroups.filter(g => g.selected).length;
                if (groupCountBadge) {
                    groupCountBadge.textContent = `${filteredGroups.length}/${loadedGroups.length} visible | ${selCount} selected`;
                }
            }
        });
    });
}

export function initGroupSearch() {
    if (groupSearchInput) {
        groupSearchInput.addEventListener('input', renderGroups);
    }
    if (btnSelectAllFiltered) {
        btnSelectAllFiltered.addEventListener('click', () => {
            const searchTerm = (groupSearchInput.value || '').toLowerCase().trim();
            loadedGroups.forEach(g => {
                if (g.name.toLowerCase().includes(searchTerm) || g.url.toLowerCase().includes(searchTerm)) {
                    g.selected = true;
                }
            });
            renderGroups();
        });
    }
    if (btnDeselectAll) {
        btnDeselectAll.addEventListener('click', () => {
            loadedGroups.forEach(g => { g.selected = false; });
            renderGroups();
        });
    }
}
