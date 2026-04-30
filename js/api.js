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

// ИСПРАВЛЕННАЯ ФУНКЦИЯ - принудительно обновляет кэш
async function getPhotoUrl(itemId) {
    // Принудительно удаляем старый кэш при каждом запросе для свежести данных
    if (photoCache && photoCache.has(itemId)) {
        photoCache.delete(itemId);
    }
    
    if (!isOnline) {
        return null;
    }
    
    try {
        // Добавляем timestamp чтобы всегда получать свежие данные с сервера
        const response = await fetch(buildApiUrl("getPhotoUrl", `&itemId=${itemId}&_=${Date.now()}`));
        const result = await response.json();
        
        console.log("getPhotoUrl response:", result);
        
        if (result.success && result.hasPhoto && result.url) {
            if (photoCache) photoCache.set(itemId, result.url);
            return result.url;
        }
        return null;
    } catch(e) {
        console.error("Error getting photo:", e);
        return null;
    }
}

async function uploadPhoto(itemId, file) {
    if (!isOnline) {
        showToast("Загрузка фото доступна только онлайн", false);
        return false;
    }
    
    if (!file.type.startsWith('image/')) {
        showToast("Пожалуйста, выберите изображение", false);
        return false;
    }
    
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async function() {
            try {
                const base64Data = reader.result;
                
                const params = new URLSearchParams();
                params.append('action', 'uploadPhoto');
                params.append('participant', CURRENT_USER.id);
                params.append('itemId', itemId.toString());
                params.append('userId', CURRENT_USER.id);
                params.append('base64Data', base64Data);
                params.append('fileName', file.name);
                
                console.log("📤 Загрузка фото:");
                console.log("  - itemId:", itemId);
                console.log("  - userId:", CURRENT_USER.id);
                console.log("  - fileName:", file.name);
                console.log("  - fileSize:", (file.size / 1024).toFixed(2), "KB");
                
                const response = await fetch(CENTRAL_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: params.toString()
                });
                
                const result = await response.json();
                
                if (result.success) {
                    console.log("✅ Фото загружено на сервер!");
                    
                    // Ждём 2 секунды, чтобы Google Drive успел обработать файл
                    showToast("Обработка фото...", true);
                    await new Promise(r => setTimeout(r, 2000));
                    
                    // Пробуем получить фото несколько раз
                    let photoFound = false;
                    for (let attempt = 1; attempt <= 3; attempt++) {
                        console.log(`Попытка получить фото #${attempt}...`);
                        
                        // Очищаем кэш
                        if (photoCache) photoCache.delete(itemId);
                        
                        const checkResponse = await fetch(buildApiUrl("getPhotoUrl", `&itemId=${itemId}&_=${Date.now()}`));
                        const checkResult = await checkResponse.json();
                        
                        console.log(`Попытка ${attempt}:`, checkResult);
                        
                        if (checkResult.success && checkResult.hasPhoto && checkResult.url) {
                            photoFound = true;
                            if (photoCache) photoCache.set(itemId, checkResult.url);
                            console.log("✅ Фото найдено! URL:", checkResult.url);
                            break;
                        }
                        
                        // Ждём между попытками
                        if (attempt < 3) await new Promise(r => setTimeout(r, 1500));
                    }
                    
                    if (photoFound) {
                        showToast("Фото загружено", true);
                        resolve(true);
                    } else {
                        showToast("Фото загружено, но не отображается. Обновите страницу.", false);
                        resolve(true); // Всё равно возвращаем true, фото есть на диске
                    }
                } else {
                    console.error("❌ Ошибка:", result.error);
                    showToast("Ошибка: " + (result.error || "неизвестная"), false);
                    resolve(false);
                }
            } catch(e) {
                console.error("Upload error:", e);
                showToast("Ошибка: " + e.message, false);
                resolve(false);
            }
        };
        reader.onerror = function() {
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
        const params = new URLSearchParams();
        params.append('action', 'deletePhoto');
        params.append('participant', CURRENT_USER.id);
        params.append('itemId', itemId.toString());
        params.append('userId', CURRENT_USER.id);
        
        const response = await fetch(CENTRAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (photoCache) photoCache.delete(itemId);
            showToast("Фото удалено", true);
            return true;
        } else {
            showToast("Ошибка: " + (result.error || "неизвестная"), false);
            return false;
        }
    } catch(e) {
        console.error("Delete error:", e);
        showToast("Ошибка удаления", false);
        return false;
    }
}
