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

// Вспомогательная функция для построения параметров строки запроса из объекта
function buildParamsFromObject(obj) {
    if (!obj) return "";
    const parts = [];
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object') {
            parts.push(`&${key}=${encodeURIComponent(JSON.stringify(value))}`);
        } else {
            parts.push(`&${key}=${encodeURIComponent(String(value))}`);
        }
    }
    return parts.join("");
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
            
            switch (op.action) {
                case "addItem":
                    url = buildApiUrl("addItem", buildParamsFromObject(op.params));
                    break;
                case "updateFullItem":
                    url = buildApiUrl("updateFullItem", buildParamsFromObject(op.params));
                    break;
                case "update":
                    url = buildApiUrl("update", buildParamsFromObject(op.params));
                    break;
                case "syncFullHistory":
                    // ВАЖНО: op.params уже является массивом истории, НЕ закодированным
                    const historyData = encodeURIComponent(JSON.stringify(op.params));
                    url = buildApiUrl("syncFullHistory", `&data=${historyData}`);
                    break;
                case "syncFullBookings":
                    const bookingsData = encodeURIComponent(JSON.stringify(op.params));
                    url = buildApiUrl("syncFullBookings", `&data=${bookingsData}`);
                    break;
                case "syncCustomOrder":
                    const orderData = encodeURIComponent(JSON.stringify(op.params));
                    url = buildApiUrl("syncCustomOrder", `&data=${orderData}`);
                    break;
                case "syncExtraCosts":
                    const costsData = encodeURIComponent(JSON.stringify(op.params));
                    url = buildApiUrl("syncExtraCosts", `&data=${costsData}`);
                    break;
                case "syncExtraIncomes":
                    const incomesData = encodeURIComponent(JSON.stringify(op.params));
                    url = buildApiUrl("syncExtraIncomes", `&data=${incomesData}`);
                    break;
                case "syncFullRules":
                    const rulesData = encodeURIComponent(JSON.stringify(op.params));
                    url = buildApiUrl("syncFullRules", `&data=${rulesData}`);
                    break;
                case "hideHistoryEntry":
                    url = buildApiUrl("hideHistoryEntry", buildParamsFromObject(op.params));
                    break;
                case "cancelHistoryEntry":
                    url = buildApiUrl("cancelHistoryEntry", buildParamsFromObject(op.params));
                    break;
                case "savePrivacy":
                    const privacyData = encodeURIComponent(JSON.stringify(op.params));
                    url = buildApiUrl("savePrivacy", `&data=${privacyData}`);
                    break;
                case "cancelBooking":
                    url = buildApiUrl("cancelBooking", buildParamsFromObject(op.params));
                    break;
                default:
                    url = buildApiUrl(op.action, buildParamsFromObject(op.params));
            }
            
            const response = await fetch(url);
            const result = await response.json();
            if (!result.success) {
                failed.push(op);
                if (!silent) console.warn(`Operation failed: ${op.action}`, result);
            }
        } catch(e) {
            console.error(`Error processing operation ${op.action}:`, e);
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
