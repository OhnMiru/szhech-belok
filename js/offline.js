// ========== ОФЛАЙН-СИНХРОНИЗАЦИЯ ==========
function savePendingOperations() {
    localStorage.setItem('merch_pending_ops', JSON.stringify(pendingOperations));
}

function loadPendingOperations() {
    const saved = localStorage.getItem('merch_pending_ops');
    if (saved) {
        try {
            pendingOperations = JSON.parse(saved);
        } catch(e) { pendingOperations = []; }
    } else {
        pendingOperations = [];
    }
}

async function processPendingOperations(silent = false) {
    if (!isOnline) return;
    if (pendingOperations.length === 0) return;
    
    if (!silent) {
        showToast(`Синхронизация (${pendingOperations.length} операций)...`, true);
    }
    
    const failed = [];
    for (const op of pendingOperations) {
        try {
            let url;
            if (op.action === "addItem") {
                url = buildApiUrl("addItem", op.params);
            } else if (op.action === "updateFullItem") {
                url = buildApiUrl("updateFullItem", op.params);
            } else if (op.action === "update") {
                url = buildApiUrl("update", op.params);
            } else if (op.action === "syncFullHistory") {
                url = buildApiUrl("syncFullHistory", `&data=${encodeURIComponent(op.params)}`);
            } else if (op.action === "syncFullBookings") {
                url = buildApiUrl("syncFullBookings", `&data=${encodeURIComponent(op.params)}`);
            } else if (op.action === "syncCustomOrder") {
                url = buildApiUrl("syncCustomOrder", `&data=${encodeURIComponent(op.params)}`);
            } else if (op.action === "syncExtraCosts") {
                url = buildApiUrl("syncExtraCosts", `&data=${encodeURIComponent(op.params)}`);
            } else if (op.action === "syncExtraIncomes") {
                url = buildApiUrl("syncExtraIncomes", `&data=${encodeURIComponent(op.params)}`);
            } else if (op.action === "syncFullRules") {
                url = buildApiUrl("syncFullRules", `&data=${encodeURIComponent(op.params)}`);
            } else if (op.action === "hideHistoryEntry") {
                url = buildApiUrl("hideHistoryEntry", op.params);
            } else if (op.action === "cancelHistoryEntry") {
                url = buildApiUrl("cancelHistoryEntry", op.params);
            } else if (op.action === "savePrivacy") {
                url = buildApiUrl("savePrivacy", `&data=${encodeURIComponent(op.params)}`);
            } else if (op.action === "cancelBooking") {
                url = buildApiUrl("cancelBooking", op.params);
            } else {
                url = buildApiUrl(op.action, op.params);
            }
            const response = await fetch(url);
            const result = await response.json();
            if (!result.success) {
                failed.push(op);
            }
        } catch(e) {
            failed.push(op);
        }
    }
    
    if (failed.length === 0) {
        pendingOperations = [];
        if (!silent) {
            showToast("Все операции синхронизированы", true);
        }
    } else {
        pendingOperations = failed;
        if (!silent) {
            showToast(`Не синхронизировано: ${failed.length} операций`, false);
        }
    }
    savePendingOperations();
}

function addPendingOperation(action, params) {
    pendingOperations.push({ action: action, params: params, timestamp: Date.now() });
    savePendingOperations();
    if (isOnline) {
        processPendingOperations(true);
    }
}

window.addEventListener('online', () => {
    isOnline = true;
    showToast("Соединение восстановлено, синхронизация...", true);
    processPendingOperations(false);
    loadData(false, false);
});

window.addEventListener('offline', () => {
    isOnline = false;
    showToast("Нет соединения с интернетом. Изменения сохранятся локально.", false);
});
