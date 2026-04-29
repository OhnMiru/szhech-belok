// ========== API ФУНКЦИИ ==========
function buildApiUrl(action, extraParams = "") {
    if (!CURRENT_USER.id) return "#";
    return `${CENTRAL_API_URL}?action=${action}&participant=${CURRENT_USER.id}${extraParams}&t=${Date.now()}`;
}

async function loadData(showLoading = true, showProgress = false) {
    if (isLoading) return;
    isLoading = true;
    const isAutoRefresh = showProgress && !showLoading;
    if (!isAutoRefresh) {
        const autoRefreshBadge = document.querySelector('.auto-refresh-badge');
        if (autoRefreshBadge) { autoRefreshBadge.style.opacity = '0'; autoRefreshBadge.style.visibility = 'hidden'; }
        if (showProgress) showProgressBar();
        if (showLoading) { const container = document.getElementById('cards-container'); if (container) container.innerHTML = '<div class="loading">Загрузка бананчиков...</div>'; }
    }
    try {
        const response = await fetch(buildApiUrl("get"));
        const data = await response.json();
        if (data && data.length > 0) {
            originalCardsData = data;
            updateTypeOptions();
            filterAndSort();
            showUpdateTime();
            updateCartUI();
        } else if (showLoading && !isAutoRefresh) {
            const container = document.getElementById('cards-container');
            if (container) container.innerHTML = '<div class="loading">Нет данных. Проверьте таблицу и лист "Мерч". 🍌</div>';
        }
    } catch (error) {
        console.error(error);
        if (showLoading && !isAutoRefresh) {
            const container = document.getElementById('cards-container');
            if (container) container.innerHTML = '<div class="loading">Ошибка загрузки. Проверьте интернет и ссылку. 🍌</div>';
        }
    } finally {
        isLoading = false;
        if (!isAutoRefresh) {
            if (showProgress) hideProgressBar();
            const autoRefreshBadge = document.querySelector('.auto-refresh-badge');
            if (autoRefreshBadge) { autoRefreshBadge.style.opacity = ''; autoRefreshBadge.style.visibility = ''; }
        }
    }
}
// Добавить в api.js после существующих функций

async function updateFullItem(id, type, name, stock, total, price, cost) {
    if (!isOnline) {
        addPendingOperation("updateFullItem", `&id=${id}&type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}&stock=${stock}&total=${total}&price=${price}&cost=${cost}`);
        return { success: true, offline: true };
    }
    try {
        const response = await fetch(buildApiUrl("updateFullItem", `&id=${id}&type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}&stock=${stock}&total=${total}&price=${price}&cost=${cost}`));
        return await response.json();
    } catch(e) {
        addPendingOperation("updateFullItem", `&id=${id}&type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}&stock=${stock}&total=${total}&price=${price}&cost=${cost}`);
        return { success: true, offline: true };
    }
}

async function addNewItem(type, name, total, stock, price, cost) {
    if (!isOnline) {
        addPendingOperation("addItem", `&type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}&total=${total}&stock=${stock}&price=${price}&cost=${cost}`);
        // Временно добавляем товар в локальный массив
        const tempId = -Date.now();
        const newItem = {
            id: tempId,
            type: type,
            name: name,
            total: total,
            stock: stock,
            price: price,
            cost: cost || 0
        };
        originalCardsData.push(newItem);
        updateTypeOptions();
        filterAndSort();
        showToast(`Товар "${name}" добавлен (будет синхронизирован при восстановлении соединения)`, true);
        return { success: true, offline: true, id: tempId };
    }
    
    try {
        const response = await fetch(buildApiUrl("addItem", `&type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}&total=${total}&stock=${stock}&price=${price}&cost=${cost}`));
        const result = await response.json();
        if (result.success) {
            // Добавляем товар в локальный массив с полученным ID
            const newItem = {
                id: result.id,
                type: type,
                name: name,
                total: total,
                stock: stock,
                price: price,
                cost: cost || 0
            };
            originalCardsData.push(newItem);
            updateTypeOptions();
            filterAndSort();
            showToast(`Товар "${name}" добавлен!`, true);
        } else {
            showToast("Ошибка: " + (result.error || "неизвестная"), false);
        }
        return result;
    } catch(e) {
        console.error(e);
        addPendingOperation("addItem", `&type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}&total=${total}&stock=${stock}&price=${price}&cost=${cost}`);
        const tempId = -Date.now();
        const newItem = {
            id: tempId,
            type: type,
            name: name,
            total: total,
            stock: stock,
            price: price,
            cost: cost || 0
        };
        originalCardsData.push(newItem);
        updateTypeOptions();
        filterAndSort();
        showToast(`Товар "${name}" добавлен (будет синхронизирован при восстановлении соединения)`, true);
        return { success: true, offline: true, id: tempId };
    }
}
