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

async function processPendingOperations() {
    if (!isOnline) return;
    if (pendingOperations.length === 0) return;
    
    showToast(`Синхронизация (${pendingOperations.length} операций)...`, true);
    
    const failed = [];
    for (const op of pendingOperations) {
        try {
            let url = buildApiUrl(op.action, op.params);
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
        showToast("Все операции синхронизированы", true);
    } else {
        pendingOperations = failed;
        showToast(`Не синхронизировано: ${failed.length} операций`, false);
    }
    savePendingOperations();
}

function addPendingOperation(action, params) {
    pendingOperations.push({ action: action, params: params, timestamp: Date.now() });
    savePendingOperations();
    if (isOnline) {
        processPendingOperations();
    }
}

window.addEventListener('online', () => {
    isOnline = true;
    showToast("Соединение восстановлено, синхронизация...", true);
    processPendingOperations();
    loadData(false, false);
});

window.addEventListener('offline', () => {
    isOnline = false;
    showToast("Нет соединения с интернетом. Изменения сохранятся локально.", false);
});
