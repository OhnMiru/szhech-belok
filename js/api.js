// ========== API ФУНКЦИИ ==========
console.log("🔧 api.js начал загрузку");

// НЕ ОБЪЯВЛЯЕМ CENTRAL_API_URL ЗДЕСЬ - она уже в config.js

function buildApiUrl(action, extraParams = "") {
    if (!window.CURRENT_USER?.id) return "#";
    if (action === "getPhotoUrl" || action === "getComment") {
        return `${window.CENTRAL_API_URL}?action=${action}&participant=${window.CURRENT_USER.id}${extraParams}&_=${Date.now()}`;
    }
    return `${window.CENTRAL_API_URL}?action=${action}&participant=${window.CURRENT_USER.id}${extraParams}&t=${Date.now()}`;
}

async function loadData(showLoading = true, showProgress = false) {
    console.log("✅ loadData ВЫЗВАНА!");
    if (window.isLoading) return;
    window.isLoading = true;
    try {
        const response = await fetch(buildApiUrl("get"));
        const data = await response.json();
        console.log("Данные получены:", data?.length || 0);
        if (data && data.length > 0) {
            window.originalCardsData = data;
            if (typeof window.updateTypeOptions === 'function') window.updateTypeOptions();
            if (typeof window.filterAndSort === 'function') window.filterAndSort();
            if (typeof window.showUpdateTime === 'function') window.showUpdateTime();
            if (typeof window.updateCartUI === 'function') window.updateCartUI();
        }
    } catch (error) {
        console.error("loadData error:", error);
    } finally {
        window.isLoading = false;
    }
}

async function updateFullItem(id, type, name, stock, total, price, cost) {
    if (!window.isOnline) {
        if (typeof addPendingOperation === 'function') addPendingOperation("updateFullItem", { id: id, type: type, name: name, stock: stock, total: total, price: price, cost: cost });
        return { success: true, offline: true };
    }
    try {
        const params = `&id=${id}&type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}&stock=${stock}&total=${total}&price=${price}&cost=${cost}`;
        const response = await fetch(buildApiUrl("updateFullItem", params));
        return await response.json();
    } catch(e) {
        if (typeof addPendingOperation === 'function') addPendingOperation("updateFullItem", { id: id, type: type, name: name, stock: stock, total: total, price: price, cost: cost });
        return { success: true, offline: true };
    }
}

async function sendAddItemRequest(type, name, total, stock, price, cost) {
    if (!window.isOnline) {
        if (typeof addPendingOperation === 'function') addPendingOperation("addItem", { type: type, name: name, total: total, stock: stock, price: price, cost: cost });
        const tempId = -Date.now();
        const newItem = { id: tempId, type: type, name: name, total: total, stock: stock, price: price, cost: cost || 0 };
        window.originalCardsData.push(newItem);
        if (typeof updateTypeOptions === 'function') updateTypeOptions();
        if (typeof filterAndSort === 'function') filterAndSort();
        if (typeof showToast === 'function') showToast(`Товар "${name}" добавлен (будет синхронизирован)`, true);
        return { success: true, offline: true, id: tempId };
    }
    
    try {
        const params = `&type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}&total=${total}&stock=${stock}&price=${price}&cost=${cost}`;
        const response = await fetch(buildApiUrl("addItem", params));
        const result = await response.json();
        if (result.success) {
            const newItem = { id: result.id, type: type, name: name, total: total, stock: stock, price: price, cost: cost || 0 };
            window.originalCardsData.push(newItem);
            if (typeof updateTypeOptions === 'function') updateTypeOptions();
            if (typeof filterAndSort === 'function') filterAndSort();
            if (typeof showToast === 'function') showToast(`Товар "${name}" добавлен!`, true);
        }
        return result;
    } catch(e) {
        if (typeof addPendingOperation === 'function') addPendingOperation("addItem", { type: type, name: name, total: total, stock: stock, price: price, cost: cost });
        return { success: true, offline: true };
    }
}

async function getPhotoUrl(itemId) {
    return null;
}

async function uploadPhoto(itemId, file) {
    if (typeof showToast === 'function') showToast("Фото временно недоступно", false);
    return false;
}

async function deletePhoto(itemId) {
    return true;
}

// Экспортируем функции в глобальную область
window.buildApiUrl = buildApiUrl;
window.loadData = loadData;
window.updateFullItem = updateFullItem;
window.sendAddItemRequest = sendAddItemRequest;
window.getPhotoUrl = getPhotoUrl;
window.uploadPhoto = uploadPhoto;
window.deletePhoto = deletePhoto;

console.log("✅ api.js загружен, buildApiUrl определена:", typeof window.buildApiUrl);
