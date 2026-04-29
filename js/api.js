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

async function updateFullItem(id, type, name, stock, total, price, cost) {
    if (!isOnline) {
        addPendingOperation("updateFullItem", { id: id, type: type, name: name, stock: stock, total: total, price: price, cost: cost });
        return { success: true, offline: true };
    }
    try {
        const params = `&id=${id}&type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}&stock=${stock}&total=${total}&price=${price}&cost=${cost}`;
        const response = await fetch(buildApiUrl("updateFullItem", params));
        return await response.json();
    } catch(e) {
        addPendingOperation("updateFullItem", { id: id, type: type, name: name, stock: stock, total: total, price: price, cost: cost });
        return { success: true, offline: true };
    }
}

async function sendAddItemRequest(type, name, total, stock, price, cost) {
    if (!isOnline) {
        addPendingOperation("addItem", { type: type, name: name, total: total, stock: stock, price: price, cost: cost });
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
        const params = `&type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}&total=${total}&stock=${stock}&price=${price}&cost=${cost}`;
        const response = await fetch(buildApiUrl("addItem", params));
        const result = await response.json();
        if (result.success) {
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
        addPendingOperation("addItem", { type: type, name: name, total: total, stock: stock, price: price, cost: cost });
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

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ФОТО ==========

async function getPhotoUrl(itemId) {
    // Проверяем кэш
    if (photoCache.has(itemId)) {
        return photoCache.get(itemId);
    }
    
    if (!isOnline) {
        return null;
    }
    
    try {
        const response = await fetch(buildApiUrl("getPhotoUrl", `&itemId=${itemId}`));
        const result = await response.json();
        
        if (result.success && result.hasPhoto && result.url) {
            photoCache.set(itemId, result.url);
            return result.url;
        }
        return null;
    } catch(e) {
        console.error("Error getting photo URL:", e);
        return null;
    }
}

// ИСПРАВЛЕННАЯ ФУНКЦИЯ ЗАГРУЗКИ ФОТО - использует FormData вместо GET параметров
async function uploadPhoto(itemId, file) {
    if (!isOnline) {
        showToast("Загрузка фото доступна только онлайн", false);
        return false;
    }
    
    // Проверяем размер файла (максимум 5 МБ)
    if (file.size > 5 * 1024 * 1024) {
        showToast("Файл слишком большой. Максимум 5 МБ", false);
        return false;
    }
    
    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
        showToast("Пожалуйста, выберите изображение", false);
        return false;
    }
    
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async function() {
            try {
                const base64Data = reader.result;
                
                // Используем FormData для отправки файла
                const formData = new FormData();
                formData.append('action', 'uploadPhoto');
                formData.append('participant', CURRENT_USER.id);
                formData.append('itemId', itemId.toString());
                formData.append('base64Data', base64Data);
                formData.append('fileName', file.name);
                
                console.log("Uploading photo for item:", itemId);
                console.log("File name:", file.name);
                console.log("File size:", (file.size / 1024).toFixed(2), "KB");
                
                const response = await fetch(CENTRAL_API_URL, {
                    method: 'POST',
                    body: formData
                });
                
                console.log("Response status:", response.status);
                
                const result = await response.json();
                console.log("Response result:", result);
                
                if (result.success) {
                    // Обновляем кэш
                    if (result.url) {
                        photoCache.set(itemId, result.url);
                    }
                    showToast("Фото загружено", true);
                    resolve(true);
                } else {
                    showToast("Ошибка загрузки фото: " + (result.error || "неизвестная"), false);
                    resolve(false);
                }
            } catch(e) {
                console.error("Upload error:", e);
                showToast("Ошибка загрузки фото: " + e.message, false);
                resolve(false);
            }
        };
        reader.onerror = function() {
            console.error("FileReader error");
            showToast("Ошибка чтения файла", false);
            resolve(false);
        };
        reader.readAsDataURL(file);
    });
}

async function deletePhoto(itemId) {
    if (!isOnline) {
        showToast("Удаление фото доступно только онлайн", false);
        return false;
    }
    
    try {
        const formData = new FormData();
        formData.append('action', 'deletePhoto');
        formData.append('participant', CURRENT_USER.id);
        formData.append('itemId', itemId.toString());
        
        const response = await fetch(CENTRAL_API_URL, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            photoCache.delete(itemId);
            showToast("Фото удалено", true);
            return true;
        } else {
            showToast("Ошибка удаления фото: " + (result.error || "неизвестная"), false);
            return false;
        }
    } catch(e) {
        console.error(e);
        showToast("Ошибка удаления фото", false);
        return false;
    }
}
