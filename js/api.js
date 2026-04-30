// ========== API ФУНКЦИИ (МИНИМАЛЬНАЯ ВЕРСИЯ ДЛЯ ТЕСТА) ==========

const CENTRAL_API_URL = "https://szhech-belochek.pages.dev/api";

function buildApiUrl(action, extraParams = "") {
    if (!CURRENT_USER.id) return "#";
    return `${CENTRAL_API_URL}?action=${action}&participant=${CURRENT_USER.id}${extraParams}&t=${Date.now()}`;
}

async function loadData(showLoading = true, showProgress = false) {
    console.log("✅ loadData работает!");
    if (isLoading) return;
    isLoading = true;
    try {
        const response = await fetch(buildApiUrl("get"));
        const data = await response.json();
        if (data && data.length > 0) {
            originalCardsData = data;
            if (typeof updateTypeOptions === 'function') updateTypeOptions();
            if (typeof filterAndSort === 'function') filterAndSort();
            if (typeof showUpdateTime === 'function') showUpdateTime();
            if (typeof updateCartUI === 'function') updateCartUI();
        }
    } catch (error) {
        console.error("loadData error:", error);
    } finally {
        isLoading = false;
    }
}

async function updateFullItem(id, type, name, stock, total, price, cost) {
    console.log("updateFullItem called");
    return { success: true };
}

async function sendAddItemRequest(type, name, total, stock, price, cost) {
    console.log("sendAddItemRequest called");
    return { success: true, id: Date.now() };
}

async function getPhotoUrl(itemId) {
    return null;
}

async function uploadPhoto(itemId, file) {
    showToast("Фото временно недоступно", false);
    return false;
}

async function deletePhoto(itemId) {
    return true;
}

console.log("✅ api.js загружен!");
