// ========== ДОПОЛНИТЕЛЬНЫЕ ДОХОДЫ ==========
let extraIncomes = [];

async function syncExtraIncomesToServer() {
    if (!isOnline) {
        addPendingOperation("syncExtraIncomes", `&data=${encodeURIComponent(JSON.stringify(extraIncomes))}`);
        return;
    }
    try {
        const data = encodeURIComponent(JSON.stringify(extraIncomes));
        await fetch(buildApiUrl("syncExtraIncomes", `&data=${data}`));
    } catch(e) { 
        console.error(e); 
        addPendingOperation("syncExtraIncomes", `&data=${encodeURIComponent(JSON.stringify(extraIncomes))}`);
    }
}

async function loadExtraIncomesFromServer() {
    if (!isOnline) {
        loadExtraIncomesFromLocal();
        return false;
    }
    try {
        const response = await fetch(buildApiUrl("getExtraIncomes"));
        const data = await response.json();
        if (data && data.incomes) {
            extraIncomes = data.incomes;
            saveExtraIncomesToLocal();
            return true;
        }
        return false;
    } catch(e) { return false; }
}

function saveExtraIncomesToLocal() {
    localStorage.setItem('merch_extra_incomes', JSON.stringify(extraIncomes));
}

function loadExtraIncomesFromLocal() {
    const saved = localStorage.getItem('merch_extra_incomes');
    if (saved) extraIncomes = JSON.parse(saved);
    else extraIncomes = [];
}

async function loadExtraIncomes() {
    const loaded = await loadExtraIncomesFromServer();
    if (!loaded) loadExtraIncomesFromLocal();
}

function saveExtraIncomes() {
    saveExtraIncomesToLocal();
    syncExtraIncomesToServer();
}

function addExtraIncome(name, amount) {
    extraIncomes.push({ id: Date.now(), name: name, amount: amount });
    saveExtraIncomes();
    if (document.getElementById('statsModal')?.style.display === 'block') renderStats();
}

function deleteExtraIncome(index) {
    extraIncomes.splice(index, 1);
    saveExtraIncomes();
    if (document.getElementById('statsModal')?.style.display === 'block') renderStats();
}
