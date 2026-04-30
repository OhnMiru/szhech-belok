// ========== API ФУНКЦИИ ==========
function buildApiUrl(action, extraParams = "") {
    if (!CURRENT_USER.id) return "#";
    if (action === "getPhotoUrl" || action === "getComment") {
        return `${CENTRAL_API_URL}?action=${action}&participant=${CURRENT_USER.id}${extraParams}&_=${Date.now()}`;
    }
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
            if (typeof loadAllComments === 'function') {
                loadAllComments();
            }
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

// ========== ФУНКЦИИ ДЛЯ КОММЕНТАРИЕВ ==========

let commentsCache = new Map();

async function loadAllComments() {
    if (!isOnline) {
        loadCommentsFromLocal();
        return;
    }
    
    try {
        const response = await fetch(buildApiUrl("getAllComments"));
        const result = await response.json();
        if (result.success && result.comments) {
            commentsCache.clear();
            for (const item of result.comments) {
                commentsCache.set(item.itemId, {
                    comment: item.comment,
                    lastUpdated: item.lastUpdated
                });
            }
            saveCommentsToLocal();
            if (typeof updateCommentIndicators === 'function') {
                updateCommentIndicators();
            }
        }
    } catch(e) {
        console.error("Error loading comments:", e);
        loadCommentsFromLocal();
    }
}

async function saveComment(itemId, comment) {
    if (!isOnline) {
        addPendingOperation("saveComment", { itemId: itemId, comment: comment });
        commentsCache.set(itemId, { comment: comment, lastUpdated: new Date().toISOString() });
        saveCommentsToLocal();
        if (typeof updateCommentIndicators === 'function') {
            updateCommentIndicators();
        }
        showToast("Комментарий сохранён локально", true);
        return true;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('action', 'saveComment');
        params.append('participant', CURRENT_USER.id);
        params.append('itemId', itemId.toString());
        params.append('userId', CURRENT_USER.id);
        params.append('comment', comment);
        
        const response = await fetch(CENTRAL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
        
        const result = await response.json();
        
        if (result.success) {
            commentsCache.set(itemId, { comment: comment, lastUpdated: new Date().toISOString() });
            saveCommentsToLocal();
            if (typeof updateCommentIndicators === 'function') {
                updateCommentIndicators();
            }
            showToast("Комментарий сохранён", true);
            return true;
        } else {
            showToast("Ошибка: " + (result.error || "неизвестная"), false);
            return false;
        }
    } catch(e) {
        console.error("Save comment error:", e);
        addPendingOperation("saveComment", { itemId: itemId, comment: comment });
        showToast("Комментарий сохранён локально", true);
        return true;
    }
}

async function getComment(itemId) {
    if (commentsCache.has(itemId)) {
        return commentsCache.get(itemId);
    }
    
    if (!isOnline) {
        return null;
    }
    
    try {
        const response = await fetch(buildApiUrl("getComment", `&itemId=${itemId}&userId=${CURRENT_USER.id}`));
        const result = await response.json();
        
        if (result.success && result.comment !== null) {
            commentsCache.set(itemId, { comment: result.comment, lastUpdated: result.lastUpdated });
            saveCommentsToLocal();
            return commentsCache.get(itemId);
        }
        return null;
    } catch(e) {
        console.error("Error getting comment:", e);
        return null;
    }
}

function saveCommentsToLocal() {
    const commentsObj = {};
    for (const [key, value] of commentsCache.entries()) {
        commentsObj[key] = value;
    }
    localStorage.setItem('merch_comments', JSON.stringify(commentsObj));
}

function loadCommentsFromLocal() {
    const saved = localStorage.getItem('merch_comments');
    if (saved) {
        try {
            const commentsObj = JSON.parse(saved);
            commentsCache.clear();
            for (const [key, value] of Object.entries(commentsObj)) {
                commentsCache.set(parseInt(key), value);
            }
            if (typeof updateCommentIndicators === 'function') {
                updateCommentIndicators();
            }
        } catch(e) {
            console.error("Error loading comments from localStorage:", e);
        }
    }
}

// ========== ФУНКЦИИ ДЛЯ ПОСТАВКИ ==========

async function addSupply(itemId, quantity) {
    if (!isOnline) {
        addPendingOperation("addSupply", { itemId: itemId, quantity: quantity });
        const card = originalCardsData.find(c => c.id === itemId);
        if (card) {
            card.total += quantity;
            card.stock += quantity;
            filterAndSort();
            showToast(`Поставка добавлена локально (${quantity} шт)`, true);
        }
        return true;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('action', 'addSupply');
        params.append('participant', CURRENT_USER.id);
        params.append('userId', CURRENT_USER.id);
        params.append('itemId', itemId.toString());
        params.append('quantity', quantity.toString());
        
        const response = await fetch(CENTRAL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
        
        const result = await response.json();
        
        if (result.success) {
            const card = originalCardsData.find(c => c.id === itemId);
            if (card) {
                card.total = result.newTotal;
                card.stock = result.newStock;
                filterAndSort();
            }
            showToast(`Поставка добавлена: +${quantity} шт`, true);
            return true;
        } else {
            showToast("Ошибка: " + (result.error || "неизвестная"), false);
            return false;
        }
    } catch(e) {
        console.error("Add supply error:", e);
        addPendingOperation("addSupply", { itemId: itemId, quantity: quantity });
        showToast("Поставка сохранена локально", true);
        return true;
    }
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ФОТО ==========

let photoCache = new Map();

async function getPhotoUrl(itemId) {
    if (!isOnline) {
        return null;
    }
    
    if (!itemId) {
        console.error("getPhotoUrl called without itemId");
        return null;
    }
    
    try {
        const url = `${CENTRAL_API_URL}?action=getPhotoUrl&participant=${CURRENT_USER.id}&itemId=${itemId}&userId=${CURRENT_USER.id}&_=${Date.now()}`;
        
        console.log("🔍 Fetching photo URL:", url);
        
        const response = await fetch(url);
        const result = await response.json();
        
        console.log("📸 Photo API response:", result);
        
        if (result.success && result.hasPhoto && result.url) {
            let fileId = null;
            if (result.url.includes('id=')) {
                fileId = result.url.split('id=')[1];
            } else if (result.url.includes('/d/')) {
                fileId = result.url.split('/d/')[1].split('/')[0];
            }
            
            if (fileId) {
                const proxyUrl = `https://szhech-belochek.pages.dev/api/image?id=${fileId}`;
                console.log("✅ Proxy URL:", proxyUrl);
                
                if (photoCache) photoCache.set(itemId, proxyUrl);
                return proxyUrl;
            }
            
            if (photoCache) photoCache.set(itemId, result.url);
            return result.url;
        }
        
        console.log("❌ No photo found for item", itemId);
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
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: params.toString()
                });
                
                const result = await response.json();
                
                if (result.success) {
                    console.log("✅ Фото загружено на сервер!");
                    
                    showToast("Обработка фото...", true);
                    await new Promise(r => setTimeout(r, 2000));
                    
                    let photoFound = false;
                    for (let attempt = 1; attempt <= 3; attempt++) {
                        console.log(`Попытка получить фото #${attempt}...`);
                        
                        if (photoCache) photoCache.delete(itemId);
                        
                        const checkUrl = `${CENTRAL_API_URL}?action=getPhotoUrl&participant=${CURRENT_USER.id}&itemId=${itemId}&userId=${CURRENT_USER.id}&_=${Date.now()}`;
                        const checkResponse = await fetch(checkUrl);
                        const checkResult = await checkResponse.json();
                        
                        console.log(`Попытка ${attempt}:`, checkResult);
                        
                        if (checkResult.success && checkResult.hasPhoto && checkResult.url) {
                            photoFound = true;
                            let fileId = null;
                            if (checkResult.url.includes('id=')) {
                                fileId = checkResult.url.split('id=')[1];
                            }
                            if (fileId) {
                                const proxyUrl = `https://szhech-belochek.pages.dev/api/image?id=${fileId}`;
                                if (photoCache) photoCache.set(itemId, proxyUrl);
                            }
                            break;
                        }
                        
                        if (attempt < 3) await new Promise(r => setTimeout(r, 1500));
                    }
                    
                    if (photoFound) {
                        showToast("Фото загружено", true);
                        resolve(true);
                    } else {
                        showToast("Фото загружено, но не отображается. Обновите страницу.", false);
                        resolve(true);
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
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
