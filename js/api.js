// ========== API ФУНКЦИИ (ПОЛНАЯ ВЕРСИЯ) ==========
console.log("🔧 api.js начал загрузку");

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function buildApiUrl(action, extraParams = "") {
    if (!window.CURRENT_USER?.id) return "#";
    
    let realUserParam = "";
    if (typeof window.getRealUserParam === 'function') {
        realUserParam = window.getRealUserParam();
    }
    
    if (action === "getPhotoUrl" || action === "getComment") {
        return `${window.CENTRAL_API_URL}?action=${action}&participant=${window.CURRENT_USER.id}${extraParams}${realUserParam}&_=${Date.now()}`;
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
        const response = await fetch(buildApiUrl("getMerchTypes"));
        const result = await response.json();
        
        if (result && result.types) {
            window.merchTypesConfig = result.types;
            updateMerchTypesCache();
            window.merchTypesLoaded = true;
            localStorage.setItem('merch_types_config', JSON.stringify({ types: result.types, loaded: Date.now() }));
            console.log("✅ Конфигурация типов загружена с сервера:", window.merchTypesConfig.length);
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
        const response = await fetch(buildApiUrl("get"));
        const data = await response.json();
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
            if (container) container.innerHTML = '<div class="loading">Ошибка загрузки. Проверьте интернет и ссылку.</div>';
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
        const response = await fetch(buildApiUrl("updateFullItem", params));
        return await response.json();
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
        const response = await fetch(buildApiUrl("addItem", params));
        const result = await response.json();
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

// ========== ФУНКЦИИ ДЛЯ КОММЕНТАРИЕВ ==========

async function loadAllComments() {
    if (!window.isOnline) {
        loadCommentsFromLocal();
        return;
    }
    
    try {
        const response = await fetch(buildApiUrl("getAllComments"));
        const result = await response.json();
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
        const params = new URLSearchParams();
        params.append('action', 'saveComment');
        params.append('participant', window.CURRENT_USER.id);
        params.append('itemId', itemId.toString());
        params.append('userId', window.CURRENT_USER.id);
        params.append('comment', comment);
        
        if (typeof window.getRealUserParam === 'function') {
            const realUserParam = window.getRealUserParam();
            if (realUserParam) {
                const realUserValue = realUserParam.replace('&realUser=', '');
                params.append('realUser', realUserValue);
            }
        }
        
        const response = await fetch(window.CENTRAL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
        
        const result = await response.json();
        
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
        const response = await fetch(buildApiUrl("getComment", `&itemId=${itemId}&userId=${window.CURRENT_USER.id}`));
        const result = await response.json();
        
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
        const params = new URLSearchParams();
        params.append('action', 'addSupply');
        params.append('participant', window.CURRENT_USER.id);
        params.append('userId', window.CURRENT_USER.id);
        params.append('itemId', itemId.toString());
        params.append('quantity', quantity.toString());
        
        if (typeof window.getRealUserParam === 'function') {
            const realUserParam = window.getRealUserParam();
            if (realUserParam) {
                const realUserValue = realUserParam.replace('&realUser=', '');
                params.append('realUser', realUserValue);
            }
        }
        
        const response = await fetch(window.CENTRAL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
        
        const result = await response.json();
        
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

// ========== ФУНКЦИИ ДЛЯ ФОТО ==========

async function getPhotoUrl(itemId) {
    if (!window.isOnline || !itemId) return null;
    
    try {
        const url = buildApiUrl("getPhotoUrl", `&itemId=${itemId}&userId=${window.CURRENT_USER.id}`);
        console.log("🔍 Fetching photo URL:", url);
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success && result.hasPhoto && result.url) {
            if (window.photoCache) window.photoCache.set(itemId, result.url);
            return result.url;
        }
        return null;
    } catch(e) {
        console.error("Error getting photo:", e);
        return null;
    }
}

async function uploadPhoto(itemId, file) {
    if (!window.isOnline) {
        if (typeof window.showToast === 'function') window.showToast("Загрузка фото доступна только онлайн", false);
        return false;
    }
    
    if (!file.type.startsWith('image/')) {
        if (typeof window.showToast === 'function') window.showToast("Пожалуйста, выберите изображение", false);
        return false;
    }
    
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async function() {
            try {
                const params = new URLSearchParams();
                params.append('action', 'uploadPhoto');
                params.append('participant', window.CURRENT_USER.id);
                params.append('itemId', itemId.toString());
                params.append('userId', window.CURRENT_USER.id);
                params.append('base64Data', reader.result);
                params.append('fileName', file.name);
                
                if (typeof window.getRealUserParam === 'function') {
                    const realUserParam = window.getRealUserParam();
                    if (realUserParam) {
                        params.append('realUser', realUserParam.replace('&realUser=', ''));
                    }
                }
                
                const response = await fetch(window.CENTRAL_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: params.toString()
                });
                
                const result = await response.json();
                
                if (result.success) {
                    if (window.photoCache) window.photoCache.delete(itemId);
                    if (typeof window.showToast === 'function') window.showToast("Фото загружено", true);
                    resolve(true);
                } else {
                    if (typeof window.showToast === 'function') window.showToast("Ошибка: " + (result.error || "неизвестная"), false);
                    resolve(false);
                }
            } catch(e) {
                console.error("Upload error:", e);
                if (typeof window.showToast === 'function') window.showToast("Ошибка: " + e.message, false);
                resolve(false);
            }
        };
        reader.onerror = function() {
            if (typeof window.showToast === 'function') window.showToast("Ошибка чтения файла", false);
            resolve(false);
        };
        reader.readAsDataURL(file);
    });
}

async function deletePhoto(itemId) {
    if (!window.isOnline) {
        if (typeof window.showToast === 'function') window.showToast("Удаление фото доступно только онлайн", false);
        return false;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('action', 'deletePhoto');
        params.append('participant', window.CURRENT_USER.id);
        params.append('itemId', itemId.toString());
        params.append('userId', window.CURRENT_USER.id);
        
        if (typeof window.getRealUserParam === 'function') {
            const realUserParam = window.getRealUserParam();
            if (realUserParam) {
                params.append('realUser', realUserParam.replace('&realUser=', ''));
            }
        }
        
        const response = await fetch(window.CENTRAL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (window.photoCache) window.photoCache.delete(itemId);
            if (typeof window.showToast === 'function') window.showToast("Фото удалено", true);
            return true;
        } else {
            if (typeof window.showToast === 'function') window.showToast("Ошибка: " + (result.error || "неизвестная"), false);
            return false;
        }
    } catch(e) {
        console.error("Delete error:", e);
        if (typeof window.showToast === 'function') window.showToast("Ошибка удаления", false);
        return false;
    }
}

// ========== НОВАЯ ФУНКЦИЯ: СИНХРОНИЗАЦИЯ ИСТОРИИ ПО ЧАСТЯМ ==========
async function syncFullHistoryChunked(historyData) {
    if (!window.isOnline) return;
    if (!historyData || historyData.length === 0) return;
    
    // Разбиваем на части по 5 записей
    const CHUNK_SIZE = 5;
    const chunks = [];
    
    for (let i = 0; i < historyData.length; i += CHUNK_SIZE) {
        chunks.push(historyData.slice(i, i + CHUNK_SIZE));
    }
    
    console.log(`📦 Синхронизация истории: ${historyData.length} записей, разбито на ${chunks.length} частей`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < chunks.length; i++) {
        try {
            const chunk = chunks[i];
            const data = encodeURIComponent(JSON.stringify(chunk));
            
            // Проверяем длину URL (безопасный лимит ~1800 символов)
            if (data.length > 1800) {
                console.warn(`Часть ${i + 1} слишком большая (${data.length} символов), разбиваем дальше`);
                // Рекурсивно разбиваем эту часть ещё мельче
                await syncFullHistoryChunked(chunk);
                continue;
            }
            
            const url = buildApiUrl("syncFullHistory", `&data=${data}`);
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.success) {
                successCount++;
                console.log(`✅ Часть ${i + 1}/${chunks.length} синхронизирована`);
            } else {
                failCount++;
                console.warn(`❌ Ошибка синхронизации части ${i + 1}:`, result.error);
            }
            
            // Небольшая задержка между запросами
            if (i < chunks.length - 1) {
                await new Promise(r => setTimeout(r, 200));
            }
        } catch(e) {
            failCount++;
            console.error(`Ошибка при синхронизации части ${i + 1}:`, e);
        }
    }
    
    console.log(`📊 Синхронизация истории завершена: успешно ${successCount}, ошибок ${failCount}`);
    return { success: failCount === 0, successCount, failCount };
}

// ========== ЭКСПОРТ ФУНКЦИЙ В ГЛОБАЛЬНУЮ ОБЛАСТЬ ==========
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
window.syncFullHistoryChunked = syncFullHistoryChunked;

// Новые функции для работы с типами мерча
window.loadMerchTypesConfig = loadMerchTypesConfig;
window.getTypeConfigFromCache = getTypeConfigFromCache;
window.hasAttributesForType = hasAttributesForType;
window.getAllMerchTypes = getAllMerchTypes;

console.log("✅ api.js загружен, getComment определена:", typeof window.getComment);
console.log("✅ api.js загружен, loadData определена:", typeof window.loadData);
console.log("✅ api.js загружен, loadMerchTypesConfig определена:", typeof window.loadMerchTypesConfig);
console.log("✅ api.js загружен, syncFullHistoryChunked определена:", typeof window.syncFullHistoryChunked);
