// ========== ДОПОЛНИТЕЛЬНЫЕ РАСХОДЫ ==========
async function syncExtraCostsToServer() {
    if (!isOnline) {
        addPendingOperation("syncExtraCosts", `&data=${encodeURIComponent(JSON.stringify(extraCosts))}`);
        return;
    }
    try {
        const data = encodeURIComponent(JSON.stringify(extraCosts));
        await fetch(buildApiUrl("syncExtraCosts", `&data=${data}`));
    } catch(e) { 
        console.error(e); 
        addPendingOperation("syncExtraCosts", `&data=${encodeURIComponent(JSON.stringify(extraCosts))}`);
    }
}

async function loadExtraCostsFromServer() {
    if (!isOnline) {
        loadExtraCostsFromLocal();
        return false;
    }
    try {
        const response = await fetch(buildApiUrl("getExtraCosts"));
        const data = await response.json();
        if (data && data.costs) {
            extraCosts = data.costs;
            saveExtraCostsToLocal();
            return true;
        }
        return false;
    } catch(e) { return false; }
}

function saveExtraCostsToLocal() {
    localStorage.setItem('merch_extra_costs', JSON.stringify(extraCosts));
}

function loadExtraCostsFromLocal() {
    const saved = localStorage.getItem('merch_extra_costs');
    if (saved) extraCosts = JSON.parse(saved);
    else extraCosts = [];
}

async function loadExtraCosts() {
    const loaded = await loadExtraCostsFromServer();
    if (!loaded) loadExtraCostsFromLocal();
}

function saveExtraCosts() {
    saveExtraCostsToLocal();
    syncExtraCostsToServer();
}

function addExtraCost(name, amount) {
    extraCosts.push({ id: Date.now(), name: name, amount: amount });
    saveExtraCosts();
    if (document.getElementById('statsModal')?.style.display === 'block') renderStats();
}

function deleteExtraCost(index) {
    extraCosts.splice(index, 1);
    saveExtraCosts();
    if (document.getElementById('statsModal')?.style.display === 'block') renderStats();
}

// ========== ГЛОБАЛЬНЫЕ РАСХОДЫ ДЛЯ ОРГАНИЗАТОРА ==========
async function loadGlobalExtraCosts() {
    if (!isOnline) {
        const saved = localStorage.getItem('merch_global_costs');
        if (saved) globalExtraCosts = JSON.parse(saved);
        else globalExtraCosts = [];
        return;
    }
    try {
        const response = await fetch(buildApiUrl("getAllExtraCosts"));
        const data = await response.json();
        if (data && data.costs) {
            globalExtraCosts = data.costs;
            localStorage.setItem('merch_global_costs', JSON.stringify(globalExtraCosts));
        }
    } catch(e) {
        const saved = localStorage.getItem('merch_global_costs');
        if (saved) globalExtraCosts = JSON.parse(saved);
        else globalExtraCosts = [];
    }
}

async function addGlobalExtraCost(name, amount) {
    if (!isOnline) {
        const newId = Date.now();
        globalExtraCosts.push({ id: newId, name: name, amount: amount });
        localStorage.setItem('merch_global_costs', JSON.stringify(globalExtraCosts));
        addPendingOperation("addExtraCostGlobal", `&name=${encodeURIComponent(name)}&amount=${amount}`);
        showToast("Расход добавлен (будет синхронизирован позже)", true);
        if (document.getElementById('globalStatsModal')?.style.display === 'block') {
            const container = document.getElementById('participantStatsContainer');
            if (container) renderGlobalStatsWithCosts();
        }
        return;
    }
    try {
        const response = await fetch(buildApiUrl("addExtraCostGlobal", `&name=${encodeURIComponent(name)}&amount=${amount}`));
        const result = await response.json();
        if (result.success) {
            await loadGlobalExtraCosts();
            showToast("Расход добавлен", true);
            if (document.getElementById('globalStatsModal')?.style.display === 'block') {
                const container = document.getElementById('participantStatsContainer');
                if (container) renderGlobalStatsWithCosts();
            }
        }
    } catch(e) {
        globalExtraCosts.push({ id: Date.now(), name: name, amount: amount });
        localStorage.setItem('merch_global_costs', JSON.stringify(globalExtraCosts));
        addPendingOperation("addExtraCostGlobal", `&name=${encodeURIComponent(name)}&amount=${amount}`);
        showToast("Расход добавлен (будет синхронизирован позже)", true);
    }
}

async function deleteGlobalExtraCost(index) {
    const costId = globalExtraCosts[index].id;
    if (!isOnline) {
        globalExtraCosts.splice(index, 1);
        localStorage.setItem('merch_global_costs', JSON.stringify(globalExtraCosts));
        addPendingOperation("deleteExtraCostGlobal", `&id=${costId}`);
        showToast("Расход удалён (будет синхронизирован позже)", true);
        if (document.getElementById('globalStatsModal')?.style.display === 'block') {
            const container = document.getElementById('participantStatsContainer');
            if (container) renderGlobalStatsWithCosts();
        }
        return;
    }
    try {
        const response = await fetch(buildApiUrl("deleteExtraCostGlobal", `&id=${costId}`));
        const result = await response.json();
        if (result.success) {
            await loadGlobalExtraCosts();
            showToast("Расход удалён", true);
            if (document.getElementById('globalStatsModal')?.style.display === 'block') {
                const container = document.getElementById('participantStatsContainer');
                if (container) renderGlobalStatsWithCosts();
            }
        }
    } catch(e) {
        globalExtraCosts.splice(index, 1);
        localStorage.setItem('merch_global_costs', JSON.stringify(globalExtraCosts));
        addPendingOperation("deleteExtraCostGlobal", `&id=${costId}`);
        showToast("Расход удалён (будет синхронизирован позже)", true);
    }
}
