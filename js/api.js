// ========== API ФУНКЦИИ (JSONP версия - без CORS) ==========
console.log("🔧 api.js начал загрузку (JSONP версия)");

// ========== JSONP ФУНКЦИЯ ДЛЯ ОБХОДА CORS ==========
async function jsonpRequest(action, extraParams = "") {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
        let url = buildJsonpUrl(action, extraParams, callbackName);
        
        // Ограничиваем длину URL (JSONP имеет ограничения)
        if (url.length > 2000) {
            console.warn(`URL слишком длинный (${url.length} символов) для ${action}`);
            reject(new Error('URL too long for JSONP'));
            return;
        }
        
        window[callbackName] = (data) => {
            delete window[callbackName];
            if (script.parentNode) document.body.removeChild(script);
            resolve(data);
        };
        
        const script = document.createElement('script');
        script.src = url;
        script.onerror = () => {
            delete window[callbackName];
            if (script.parentNode) document.body.removeChild(script);
            reject(new Error(`JSONP request failed for ${action}`));
        };
        
        document.body.appendChild(script);
        
        // Таймаут на случай зависания
        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                if (script.parentNode) document.body.removeChild(script);
                reject(new Error(`JSONP timeout for ${action}`));
            }
        }, 30000);
    });
}

function buildJsonpUrl(action, extraParams = "", callbackName) {
    if (!window.CURRENT_USER?.id) return "#";
    
    let realUserParam = "";
    if (typeof window.getRealUserParam === 'function') {
        realUserParam = window.getRealUserParam();
    }
    
    // Для данных большого размера используем POST через iframe? Нет, JSONP только GET
    return `${window.CENTRAL_API_URL}?action=${action}&participant=${window.CURRENT_USER.id}${extraParams}${realUserParam}&callback=${callbackName}&_=${Date.now()}`;
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function buildApiUrl(action, extraParams = "") {
    // Для обратной совместимости, но теперь используем jsonpRequest
    if (!window.CURRENT_USER?.id) return "#";
    
    let realUserParam = "";
    if (typeof window.getRealUserParam === 'function') {
        realUserParam = window.getRealUserParam();
    }
    
    return `${window.CENTRAL_API_URL}?action=${action}&participant=${window.CURRENT_USER.id}${extraParams}${realUserParam}&t=${Date.now()}`;
}

// ========== ФУНКЦИИ ДЛЯ ЗАГРУЗКИ КОНФИГУРАЦИИ ТИПОВ МЕРЧА ==========

async function loadMerchTypesConfig() {
    if (!window.isOnline) {
        const saved = localStorage.getItem('merch_types_config');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                window.merchTypesConfig = config.types || [];
                updateMerchTypesCache();
                window.merchTypesLoaded = true;
                console.log("✅ Конфигурация типов из localStorage:", window.merchTypesConfig.length);
                return true;
            } catch(e) { console.error(e); }
        }
        return false;
    }
    
    try {
        const result = await jsonpRequest("getMerchTypes");
        
        if (result && result.types) {
            window.merchTypesConfig = result.types;
            updateMerchTypesCache();
            window.merchTypesLoaded = true;
            localStorage.setItem('merch_types_config', JSON.stringify({ types: result.types, loaded: Date.now() }));
            console.log("✅ Конфигурация типов загружена:", window.merchTypesConfig.length);
            return true;
        }
        return false;
    } catch(e) {
        console.error("Ошибка загрузки:", e);
        const saved = localStorage.getItem('merch_types_config');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                window.merchTypesConfig = config.types || [];
                updateMerchTypesCache();
                window.merchTypesLoaded = true;
                return true;
            } catch(e2) { }
        }
        return false;
    }
}

function updateMerchTypesCache() {
    window.merchTypesCache.clear();
    for (const typeConfig of window.merchTypesConfig) {
        if (typeConfig && typeConfig.type) {
            window.merchTypesCache.set(typeConfig.type.toLowerCase(), typeConfig);
        }
    }
}

function getTypeConfigFromCache(typeName) {
    if (!typeName) return null;
    return window.merchTypesCache.get(typeName.toLowerCase()) || null;
}

function getAllMerchTypes() {
    return window.merchTypesConfig.map(t => t.type);
}

// ========== ОСНОВНЫЕ ФУНКЦИИ ==========
async function loadData(showLoading = true, showProgress = false) {
    console.log("✅ loadData ВЫЗВАНА!");
    if (window.isLoading) return;
    window.isLoading = true;
    
    const isAutoRefresh = showProgress && !showLoading;
    if (!isAutoRefresh) {
        const autoRefreshBadge = document.querySelector('.auto-refresh-badge');
        if (autoRefreshBadge) { autoRefreshBadge.style.opacity = '0'; autoRefreshBadge.style.visibility = 'hidden'; }
        if (showProgress && typeof showProgressBar === 'function') showProgressBar();
        if (showLoading) { 
            const container = document.getElementById('cards-container'); 
            if (container) container.innerHTML = '<div class="loading">Загрузка бананчиков...</div>'; 
        }
    }
    
    try {
        const data = await jsonpRequest("get");
        console.log("Данные получены:", data?.length || 0);
        
        if (data && data.length > 0) {
            for (const item of data) {
                if (item.attribute1 === undefined) item.attribute1 = "";
                if (item.attribute2 === undefined) item.attribute2 = "";
            }
            window.originalCardsData = data;
            if (typeof window.updateTypeOptions === 'function') window.updateTypeOptions();
            if (typeof window.filterAndSort === 'function') window.filterAndSort();
            if (typeof window.showUpdateTime === 'function') window.showUpdateTime();
            if (typeof window.updateCartUI === 'function') window.updateCartUI();
            if (typeof window.loadAllComments === 'function') {
                window.loadAllComments();
            }
        } else if (showLoading && !isAutoRefresh) {
            const container = document.getElementById('cards-container');
            if (container) container.innerHTML = '<div class="loading">Нет данных. Проверьте таблицу и лист "Мерч".</div>';
        }
    } catch (error) {
        console.error("loadData error:", error);
        if (showLoading && !isAutoRefresh) {
            const container = document.getElementById('cards-container');
            if (container) container.innerHTML = '<div class="loading">Ошибка загрузки. Проверьте интернет.</div>';
        }
    } finally {
        window.isLoading = false;
        if (!isAutoRefresh) {
            if (showProgress && typeof hideProgressBar === 'function') hideProgressBar();
            const autoRefreshBadge = document.querySelector('.auto-refresh-badge');
            if (autoRefreshBadge) { autoRefreshBadge.style.opacity = ''; autoRefreshBadge.style.visibility = ''; }
        }
    }
}

async function updateFullItem(id, type, name, stock, total, price, cost, attribute1 = "", attribute2 = "") {
    if (!window.isOnline) {
        if (typeof window.addPendingOperation === 'function') {
            window.addPendingOperation("updateFullItem", { 
                id: id, type: type, name: name, stock: stock, total: total, 
                price: price, cost: cost, attribute1: attribute1, attribute2: attribute2 
            });
        }
        return { success: true, offline: true };
    }
    try {
        const params = `&id=${id}&type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}&stock=${stock}&total=${total}&price=${price}&cost=${cost}&attribute1=${encodeURIComponent(attribute1)}&attribute2=${encodeURIComponent(attribute2)}`;
        const result = await jsonpRequest("updateFullItem", params);
        return result;
    } catch(e) {
        if (typeof window.addPendingOperation === 'function') {
            window.addPendingOperation("updateFullItem", { 
                id: id, type: type, name: name, stock: stock, total: total, 
                price: price, cost: cost, attribute1: attribute1, attribute2: attribute2 
            });
        }
        return { success: true, offline: true };
    }
}

async function sendAddItemRequest(type, name, total, stock, price, cost, attribute1 = "", attribute2 = "") {
    if (!window.isOnline) {
        if (typeof window.addPendingOperation === 'function') {
            window.addPendingOperation("addItem", { 
                type: type, name: name, total: total, stock: stock, 
                price: price, cost: cost, attribute1: attribute1, attribute2: attribute2 
            });
        }
        const tempId = -Date.now();
        const newItem = { 
            id: tempId, type: type, name: name, total: total, 
            stock: stock, price: price, cost: cost || 0,
            attribute1: attribute1, attribute2: attribute2 
        };
        window.originalCardsData.push(newItem);
        if (typeof window.updateTypeOptions === 'function') window.updateTypeOptions();
        if (typeof window.filterAndSort === 'function') window.filterAndSort();
        if (typeof window.showToast === 'function') window.showToast(`Товар "${name}" добавлен (будет синхронизирован)`, true);
        return { success: true, offline: true, id: tempId };
    }
    
    try {
        const params = `&type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}&total=${total}&stock=${stock}&price=${price}&cost=${cost}&attribute1=${encodeURIComponent(attribute1)}&attribute2=${encodeURIComponent(attribute2)}`;
        const result = await jsonpRequest("addItem", params);
        if (result.success) {
            const newItem = { 
                id: result.id, type: type, name: name, total: total, 
                stock: stock, price: price, cost: cost || 0,
                attribute1: attribute1, attribute2: attribute2 
            };
            window.originalCardsData.push(newItem);
            if (typeof window.updateTypeOptions === 'function') window.updateTypeOptions();
            if (typeof window.filterAndSort === 'function') window.filterAndSort();
            if (typeof window.showToast === 'function') window.showToast(`Товар "${name}" добавлен!`, true);
        }
        return result;
    } catch(e) {
        if (typeof window.addPendingOperation === 'function') {
            window.addPendingOperation("addItem", { 
                type: type, name: name, total: total, stock: stock, 
                price: price, cost: cost, attribute1: attribute1, attribute2: attribute2 
            });
        }
        return { success: true, offline: true };
    }
}

async function updateStock(id, delta) {
    if (!window.isOnline) {
        return { success: true, offline: true };
    }
    try {
        const result = await jsonpRequest("update", `&id=${id}&delta=${delta}`);
        return result;
    } catch(e) {
        return { success: false, error: e.message };
    }
}

// ========== ФУНКЦИИ ДЛЯ КОММЕНТАРИЕВ ==========

async function loadAllComments() {
    if (!window.isOnline) {
        loadCommentsFromLocal();
        return;
    }
    
    try {
        const result = await jsonpRequest("getAllComments");
        if (result.success && result.comments) {
            window.commentsCache.clear();
            for (const item of result.comments) {
                window.commentsCache.set(item.itemId, {
                    comment: item.comment,
                    lastUpdated: item.lastUpdated
                });
            }
            saveCommentsToLocal();
            if (typeof window.updateCommentIndicators === 'function') {
                window.updateCommentIndicators();
            }
        }
    } catch(e) {
        console.error("Error loading comments:", e);
        loadCommentsFromLocal();
    }
}

async function saveComment(itemId, comment) {
    if (!window.isOnline) {
        if (typeof window.addPendingOperation === 'function') {
            window.addPendingOperation("saveComment", { itemId: itemId, comment: comment });
        }
        window.commentsCache.set(itemId, { comment: comment, lastUpdated: new Date().toISOString() });
        saveCommentsToLocal();
        if (typeof window.updateCommentIndicators === 'function') {
            window.updateCommentIndicators();
        }
        if (typeof window.showToast === 'function') window.showToast("Комментарий сохранён локально", true);
        return true;
    }
    
    try {
        const params = `&itemId=${itemId}&comment=${encodeURIComponent(comment)}&userId=${window.CURRENT_USER.id}`;
        const result = await jsonpRequest("saveComment", params);
        
        if (result.success) {
            window.commentsCache.set(itemId, { comment: comment, lastUpdated: new Date().toISOString() });
            saveCommentsToLocal();
            if (typeof window.updateCommentIndicators === 'function') {
                window.updateCommentIndicators();
            }
            if (typeof window.showToast === 'function') window.showToast("Комментарий сохранён", true);
            return true;
        } else {
            if (typeof window.showToast === 'function') window.showToast("Ошибка: " + (result.error || "неизвестная"), false);
            return false;
        }
    } catch(e) {
        console.error("Save comment error:", e);
        if (typeof window.addPendingOperation === 'function') {
            window.addPendingOperation("saveComment", { itemId: itemId, comment: comment });
        }
        if (typeof window.showToast === 'function') window.showToast("Комментарий сохранён локально", true);
        return true;
    }
}

async function getComment(itemId) {
    if (window.commentsCache?.has(itemId)) {
        return window.commentsCache.get(itemId);
    }
    
    if (!window.isOnline) {
        return null;
    }
    
    try {
        const result = await jsonpRequest("getComment", `&itemId=${itemId}&userId=${window.CURRENT_USER.id}`);
        
        if (result.success && result.comment !== null) {
            window.commentsCache.set(itemId, { comment: result.comment, lastUpdated: result.lastUpdated });
            saveCommentsToLocal();
            return window.commentsCache.get(itemId);
        }
        return null;
    } catch(e) {
        console.error("Error getting comment:", e);
        return null;
    }
}

function saveCommentsToLocal() {
    const commentsObj = {};
    for (const [key, value] of window.commentsCache.entries()) {
        commentsObj[key] = value;
    }
    localStorage.setItem('merch_comments', JSON.stringify(commentsObj));
}

function loadCommentsFromLocal() {
    const saved = localStorage.getItem('merch_comments');
    if (saved) {
        try {
            const commentsObj = JSON.parse(saved);
            window.commentsCache.clear();
            for (const [key, value] of Object.entries(commentsObj)) {
                window.commentsCache.set(parseInt(key), value);
            }
            if (typeof window.updateCommentIndicators === 'function') {
                window.updateCommentIndicators();
            }
        } catch(e) { console.error(e); }
    }
}

// ========== ФУНКЦИИ ДЛЯ ПОСТАВКИ ==========

async function addSupply(itemId, quantity) {
    console.log("addSupply called:", itemId, quantity);
    
    if (!window.isOnline) {
        const card = window.originalCardsData?.find(c => c.id === itemId);
        if (card) {
            card.total += quantity;
            card.stock += quantity;
            if (typeof window.filterAndSort === 'function') window.filterAndSort();
            if (typeof window.showToast === 'function') window.showToast(`Поставка добавлена локально (${quantity} шт)`, true);
        }
        return true;
    }
    
    try {
        const params = `&itemId=${itemId}&quantity=${quantity}&userId=${window.CURRENT_USER.id}`;
        const result = await jsonpRequest("addSupply", params);
        
        if (result.success) {
            const card = window.originalCardsData?.find(c => c.id === itemId);
            if (card) {
                card.total = result.newTotal;
                card.stock = result.newStock;
                if (typeof window.filterAndSort === 'function') window.filterAndSort();
            }
            if (typeof window.showToast === 'function') window.showToast(`Поставка добавлена: +${quantity} шт`, true);
            return true;
        } else {
            if (typeof window.showToast === 'function') window.showToast("Ошибка: " + (result.error || "неизвестная"), false);
            return false;
        }
    } catch(e) {
        console.error("Add supply error:", e);
        if (typeof window.showToast === 'function') window.showToast("Ошибка при добавлении поставки", false);
        return false;
    }
}

// ========== ФУНКЦИИ ДЛЯ СИНХРОНИЗАЦИИ (через JSONP) ==========

async function syncFullHistory(historyData) {
    if (!window.isOnline) return;
    try {
        const data = encodeURIComponent(JSON.stringify(historyData));
        // Ограничиваем длину URL для JSONP
        if (data.length > 1500) {
            console.warn("History data too large for JSONP, skipping sync");
            return;
        }
        await jsonpRequest("syncFullHistory", `&data=${data}`);
    } catch(e) {
        console.error("Sync history error:", e);
    }
}

async function syncFullRules(rulesData) {
    if (!window.isOnline) return;
    try {
        const data = encodeURIComponent(JSON.stringify(rulesData));
        await jsonpRequest("syncFullRules", `&data=${data}`);
    } catch(e) {
        console.error("Sync rules error:", e);
    }
}

async function syncFullBookings(bookingsData) {
    if (!window.isOnline) return;
    try {
        const data = encodeURIComponent(JSON.stringify(bookingsData));
        await jsonpRequest("syncFullBookings", `&data=${data}`);
    } catch(e) {
        console.error("Sync bookings error:", e);
    }
}

async function syncExtraCosts(costsData) {
    if (!window.isOnline) return;
    try {
        const data = encodeURIComponent(JSON.stringify(costsData));
        await jsonpRequest("syncExtraCosts", `&data=${data}`);
    } catch(e) {
        console.error("Sync costs error:", e);
    }
}

async function syncExtraIncomes(incomesData) {
    if (!window.isOnline) return;
    try {
        const data = encodeURIComponent(JSON.stringify(incomesData));
        await jsonpRequest("syncExtraIncomes", `&data=${data}`);
    } catch(e) {
        console.error("Sync incomes error:", e);
    }
}

async function syncFullComments(commentsData) {
    if (!window.isOnline) return;
    try {
        const data = encodeURIComponent(JSON.stringify(commentsData));
        await jsonpRequest("syncFullComments", `&data=${data}`);
    } catch(e) {
        console.error("Sync comments error:", e);
    }
}

async function savePrivacy(privacyData) {
    if (!window.isOnline) return;
    try {
        const data = encodeURIComponent(JSON.stringify(privacyData));
        await jsonpRequest("savePrivacy", `&data=${data}`);
    } catch(e) {
        console.error("Save privacy error:", e);
    }
}

async function getPrivacy() {
    if (!window.isOnline) {
        const saved = localStorage.getItem('merch_privacy');
        if (saved) return JSON.parse(saved);
        return { shareStats: false, hideStats: false };
    }
    try {
        const result = await jsonpRequest("getPrivacy");
        return result;
    } catch(e) {
        console.error("Get privacy error:", e);
        return { shareStats: false, hideStats: false };
    }
}

async function getFullHistory() {
    if (!window.isOnline) {
        const saved = localStorage.getItem('merch_sales_history');
        if (saved) return JSON.parse(saved);
        return [];
    }
    try {
        const result = await jsonpRequest("getFullHistory");
        return result.history || [];
    } catch(e) {
        console.error("Get history error:", e);
        return [];
    }
}

async function getRules() {
    if (!window.isOnline) {
        const saved = localStorage.getItem('merch_rules_structured');
        if (saved) return JSON.parse(saved);
        return [];
    }
    try {
        const result = await jsonpRequest("getRules");
        return result.rules || [];
    } catch(e) {
        console.error("Get rules error:", e);
        return [];
    }
}

async function getExtraCosts() {
    if (!window.isOnline) {
        const saved = localStorage.getItem('merch_extra_costs');
        if (saved) return JSON.parse(saved);
        return [];
    }
    try {
        const result = await jsonpRequest("getExtraCosts");
        return result.costs || [];
    } catch(e) {
        console.error("Get costs error:", e);
        return [];
    }
}

async function getExtraIncomes() {
    if (!window.isOnline) {
        const saved = localStorage.getItem('merch_extra_incomes');
        if (saved) return JSON.parse(saved);
        return [];
    }
    try {
        const result = await jsonpRequest("getExtraIncomes");
        return result.incomes || [];
    } catch(e) {
        console.error("Get incomes error:", e);
        return [];
    }
}

async function getFullBookings() {
    if (!window.isOnline) {
        const saved = localStorage.getItem('merch_bookings');
        if (saved) return JSON.parse(saved);
        return [];
    }
    try {
        const result = await jsonpRequest("getFullBookings");
        return result.bookings || [];
    } catch(e) {
        console.error("Get bookings error:", e);
        return [];
    }
}

// ========== ФУНКЦИИ ДЛЯ ФОТО (НЕ РАБОТАЮТ, ВОЗВРАЩАЮТ ЗАГЛУШКУ) ==========

async function getPhotoUrl(itemId) {
    console.warn("Фото не поддерживается в JSONP версии");
    return null;
}

async function uploadPhoto(itemId, file) {
    console.warn("Загрузка фото не поддерживается в JSONP версии");
    if (typeof window.showToast === 'function') window.showToast("Загрузка фото недоступна в этой версии", false);
    return false;
}

async function deletePhoto(itemId) {
    console.warn("Удаление фото не поддерживается в JSONP версии");
    if (typeof window.showToast === 'function') window.showToast("Удаление фото недоступно в этой версии", false);
    return false;
}

// ========== ЭКСПОРТ ФУНКЦИЙ ==========
window.buildApiUrl = buildApiUrl;
window.loadData = loadData;
window.updateFullItem = updateFullItem;
window.sendAddItemRequest = sendAddItemRequest;
window.loadAllComments = loadAllComments;
window.saveComment = saveComment;
window.getComment = getComment;
window.saveCommentsToLocal = saveCommentsToLocal;
window.loadCommentsFromLocal = loadCommentsFromLocal;
window.addSupply = addSupply;
window.getPhotoUrl = getPhotoUrl;
window.uploadPhoto = uploadPhoto;
window.deletePhoto = deletePhoto;
window.updateStock = updateStock;

// Функции для работы с типами мерча
window.loadMerchTypesConfig = loadMerchTypesConfig;
window.getTypeConfigFromCache = getTypeConfigFromCache;
window.getAllMerchTypes = getAllMerchTypes;

// Функции синхронизации
window.syncFullHistory = syncFullHistory;
window.syncFullRules = syncFullRules;
window.syncFullBookings = syncFullBookings;
window.syncExtraCosts = syncExtraCosts;
window.syncExtraIncomes = syncExtraIncomes;
window.syncFullComments = syncFullComments;
window.savePrivacy = savePrivacy;
window.getPrivacy = getPrivacy;
window.getFullHistory = getFullHistory;
window.getRules = getRules;
window.getExtraCosts = getExtraCosts;
window.getExtraIncomes = getExtraIncomes;
window.getFullBookings = getFullBookings;

console.log("✅ api.js загружен (JSONP версия)");
console.log("✅ Фото загрузка отключена");
