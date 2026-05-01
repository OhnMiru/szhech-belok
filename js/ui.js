// ========== UI ФУНКЦИИ ==========
function openRulesModal() {
    selectedProducts.clear();
    renderRuleForm();
    renderRulesList();
    const modal = document.getElementById('rulesModal');
    if (modal) modal.style.display = 'block';
}

function closeRulesModal() {
    const modal = document.getElementById('rulesModal');
    if (modal) modal.style.display = 'none';
    closeAllRuleSelects();
}

function openStatsModal() {
    const modal = document.getElementById('statsModal');
    if (modal) { renderStats(); modal.style.display = 'block'; }
}

function closeStatsModal() { 
    const modal = document.getElementById('statsModal'); 
    if (modal) modal.style.display = 'none'; 
}

function openCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) { modal.style.display = 'block'; discountPanelOpen = false; }
    updateCartUI();
}

function closeCartModal() { 
    const modal = document.getElementById('cartModal'); 
    if (modal) modal.style.display = 'none'; 
}

function openEditProductModal(id) {
    currentEditId = id;
    const card = originalCardsData.find(c => c.id === id);
    
    if (card) {
        document.getElementById('editTitle').textContent = `✏️ Редактирование товара №${card.id}`;
        document.getElementById('editType').value = card.type || "";
        document.getElementById('editName').value = card.name || "";
        document.getElementById('editStock').value = card.stock;
        document.getElementById('editTotal').value = card.total;
        document.getElementById('editPrice').value = card.price;
        document.getElementById('editCost').value = card.cost || 0;
        
        loadPhotoPreview(id).catch(e => console.error("Error loading photo preview:", e));
        
        document.getElementById('editProductModal').style.display = 'block';
        
        setTimeout(() => {
            initPhotoUploadInEditModal();
        }, 100);
    } else {
        showToast("Товар не найден", false);
    }
}

function closeEditProductModal() {
    document.getElementById('editProductModal').style.display = 'none';
    currentEditId = null;
}

function showHistory() { 
    const modal = document.getElementById('historyModal'); 
    if (modal) { 
        resetHistoryFilters(); 
        renderHistoryList(); 
        modal.style.display = 'block'; 
    } 
}

function closeHistory() { 
    const modal = document.getElementById('historyModal'); 
    if (modal) modal.style.display = 'none'; 
}

function showGlobalStats() {
    const modal = document.getElementById('globalStatsModal');
    if (!modal) return;
    modal.style.display = 'block';
    const container = document.getElementById('globalStats-content');
    container.innerHTML = '<div class="loading">Загрузка статистики всех участников...</div>';
    if (typeof loadGlobalExtraCosts === 'function') loadGlobalExtraCosts();
    if (typeof loadGlobalExtraIncomes === 'function') loadGlobalExtraIncomes();
    if (typeof renderGlobalStatsWithData === 'function') {
        fetch(`${CENTRAL_API_URL}?action=getAllStatsFull&participant=${CURRENT_USER.id}&t=${Date.now()}`)
            .then(r => r.json())
            .then(data => {
                window._globalStatsData = data;
                renderGlobalStatsWithData(data);
            })
            .catch((err) => {
                console.error("Error loading global stats:", err);
                container.innerHTML = '<div class="loading">Ошибка загрузки статистики</div>';
                showToast("Ошибка загрузки статистики", false);
            });
    }
}

function closeGlobalStatsModal() { 
    const modal = document.getElementById('globalStatsModal'); 
    if (modal) modal.style.display = 'none'; 
}

function openBookingsModal() {
    const modal = document.getElementById('bookingsModal');
    if (modal) {
        if (typeof renderBookingsList === 'function') {
            renderBookingsList();
        }
        modal.style.display = 'block';
    }
}

function closeBookingsModal() {
    const modal = document.getElementById('bookingsModal');
    if (modal) modal.style.display = 'none';
}

// ========== ДОБАВЛЕНИЕ ТОВАРА ==========

function openAddItemModal() {
    const typeSelect = document.getElementById('addItemType');
    if (typeSelect) {
        typeSelect.innerHTML = '<option value="">Выберите или добавьте новый</option>';
        const sortedTypes = [...typeOptions].sort();
        for (const type of sortedTypes) {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        }
    }
    
    document.getElementById('addItemName').value = '';
    document.getElementById('addItemTotal').value = '0';
    document.getElementById('addItemStock').value = '0';
    document.getElementById('addItemPrice').value = '0';
    document.getElementById('addItemCost').value = '0';
    
    const newTypeInput = document.getElementById('addItemNewType');
    if (newTypeInput) {
        newTypeInput.style.display = 'none';
        newTypeInput.value = '';
    }
    
    if (typeSelect) typeSelect.style.display = 'flex';
    
    const modal = document.getElementById('addItemModal');
    if (modal) modal.style.display = 'block';
}

function closeAddItemModal() {
    const modal = document.getElementById('addItemModal');
    if (modal) modal.style.display = 'none';
}

function toggleNewTypeInput() {
    const typeSelect = document.getElementById('addItemType');
    const newTypeInput = document.getElementById('addItemNewType');
    const toggleBtn = document.getElementById('toggleNewTypeBtn');
    
    if (typeSelect.style.display !== 'none') {
        typeSelect.style.display = 'none';
        newTypeInput.style.display = 'flex';
        toggleBtn.textContent = '📋';
        newTypeInput.focus();
    } else {
        typeSelect.style.display = 'flex';
        newTypeInput.style.display = 'none';
        newTypeInput.value = '';
        toggleBtn.textContent = '➕';
        const currentType = typeSelect.value;
        typeSelect.innerHTML = '<option value="">Выберите или добавьте новый</option>';
        const sortedTypes = [...typeOptions].sort();
        for (const type of sortedTypes) {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        }
        if (currentType && typeOptions.includes(currentType)) {
            typeSelect.value = currentType;
        }
    }
}

function onTypeSelectChange() {
    const typeSelect = document.getElementById('addItemType');
    if (typeSelect.value === "") {
        if (typeSelect.style.display !== 'none') {
            toggleNewTypeInput();
        }
    }
}

async function addNewItem() {
    let type = '';
    const typeSelect = document.getElementById('addItemType');
    const newTypeInput = document.getElementById('addItemNewType');
    
    if (typeSelect.style.display !== 'none') {
        type = typeSelect.value;
        if (type === "") {
            showToast("Выберите тип товара", false);
            return;
        }
    } else {
        type = newTypeInput.value.trim();
        if (type === "") {
            showToast("Введите тип товара", false);
            return;
        }
    }
    
    const name = document.getElementById('addItemName').value.trim();
    if (name === "") {
        showToast("Введите название товара", false);
        return;
    }
    
    const total = parseInt(document.getElementById('addItemTotal').value) || 0;
    const stock = parseInt(document.getElementById('addItemStock').value) || 0;
    
    if (total < 0) {
        showToast("Количество не может быть отрицательным", false);
        return;
    }
    if (stock < 0 || stock > total) {
        showToast("Остаток не может быть отрицательным или больше общего количества", false);
        return;
    }
    
    const price = parseFloat(document.getElementById('addItemPrice').value) || 0;
    if (price < 0) {
        showToast("Цена не может быть отрицательной", false);
        return;
    }
    
    const cost = parseFloat(document.getElementById('addItemCost').value) || 0;
    if (cost < 0) {
        showToast("Себестоимость не может быть отрицательной", false);
        return;
    }
    
    await sendAddItemRequest(type, name, total, stock, price, cost);
    
    closeAddItemModal();
}

// ========== ФУНКЦИИ ДЛЯ ФОТО ==========

async function loadPhotoPreview(itemId) {
    const container = document.getElementById('photoPreviewContainer');
    if (!container) return;
    
    try {
        if (photoCache) photoCache.delete(itemId);
        
        const url = await getPhotoUrl(itemId);
        console.log("Preview URL:", url);
        
        if (url) {
            const urlWithCache = `${url}&_=${Date.now()}`;
            container.innerHTML = `<img src="${urlWithCache}" alt="Фото товара" style="max-width: 100%; max-height: 150px; border-radius: 8px; object-fit: contain; border: 1px solid var(--border-color);"
                onerror="this.onerror=null; console.error('Image failed to load:', this.src); this.parentElement.innerHTML='<div style=\"display: flex; align-items: center; justify-content: center; height: 150px; background: var(--badge-bg); border-radius: 8px; color: var(--text-muted);\">❌ Ошибка загрузки фото</div>';">`;
            const deleteBtn = document.getElementById('deletePhotoBtn');
            if (deleteBtn) deleteBtn.style.display = 'inline-flex';
        } else {
            container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 150px; background: var(--badge-bg); border-radius: 8px; color: var(--text-muted);">📷 Нет фото</div>`;
            const deleteBtn = document.getElementById('deletePhotoBtn');
            if (deleteBtn) deleteBtn.style.display = 'none';
        }
    } catch(e) {
        console.error("Error loading photo preview:", e);
        container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 150px; background: var(--badge-bg); border-radius: 8px; color: var(--text-muted);">❌ Ошибка: ${e.message}</div>`;
    }
}

async function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log("Выбран файл:", {
        name: file.name,
        type: file.type,
        size: (file.size / 1024).toFixed(2) + " KB"
    });
    
    if (!file.type.startsWith('image/')) {
        showToast("Пожалуйста, выберите изображение", false);
        return;
    }
    
    if (!currentEditId) {
        showToast("Товар не выбран", false);
        return;
    }
    
    let fileToUpload = file;
    
    showToast("Загрузка фото...", true);
    const success = await uploadPhoto(currentEditId, fileToUpload);
    
    if (success) {
        setTimeout(async () => {
            if (photoCache) photoCache.delete(currentEditId);
            await loadPhotoPreview(currentEditId);
        }, 500);
        
        const fileInput = document.getElementById('photoFileInput');
        if (fileInput) fileInput.value = '';
    }
}

async function handleDeletePhoto() {
    if (!currentEditId) {
        showToast("Товар не выбран", false);
        return;
    }
    
    if (confirm("Удалить фото товара?")) {
        showToast("Удаление фото...", true);
        const success = await deletePhoto(currentEditId);
        if (success) {
            if (photoCache) photoCache.delete(currentEditId);
            await loadPhotoPreview(currentEditId);
        }
    }
}

function openPhotoModal(itemId, itemName) {
    currentPhotoItemId = itemId;
    currentPhotoItemName = itemName;
    
    const modal = document.getElementById('photoViewModal');
    const title = document.getElementById('photoModalTitle');
    const content = document.getElementById('photoModalContent');
    
    if (title) title.textContent = `📷 ${escapeHtml(itemName)}`;
    
    if (content) {
        content.innerHTML = '<div class="loading">Загрузка фото...</div>';
    }
    
    if (modal) modal.style.display = 'block';
    
    loadPhotoToModal(itemId);
}

async function loadPhotoToModal(itemId) {
    const content = document.getElementById('photoModalContent');
    if (!content) return;
    
    try {
        if (photoCache) photoCache.delete(itemId);
        
        const url = await getPhotoUrl(itemId);
        
        if (url) {
            const urlWithCache = `${url}&_=${Date.now()}`;
            content.innerHTML = `<img src="${urlWithCache}" alt="Фото товара" style="max-width: 100%; max-height: 60vh; border-radius: 12px; object-fit: contain;">`;
        } else {
            content.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">📷 Фото не добавлено</div>`;
        }
    } catch(e) {
        console.error("Error loading photo to modal:", e);
        content.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">❌ Ошибка загрузки фото</div>`;
    }
}

function closePhotoModal() {
    const modal = document.getElementById('photoViewModal');
    if (modal) modal.style.display = 'none';
    currentPhotoItemId = null;
    currentPhotoItemName = null;
}

function initPhotoUploadInEditModal() {
    const fileInput = document.getElementById('photoFileInput');
    const deleteBtn = document.getElementById('deletePhotoBtn');
    const uploadBtn = document.getElementById('uploadPhotoBtn');
    
    if (fileInput) {
        fileInput.removeEventListener('change', handlePhotoUpload);
        fileInput.addEventListener('change', handlePhotoUpload);
    }
    
    if (deleteBtn) {
        deleteBtn.removeEventListener('click', handleDeletePhoto);
        deleteBtn.addEventListener('click', handleDeletePhoto);
    }
    
    if (uploadBtn) {
        const newUploadBtn = uploadBtn.cloneNode(true);
        uploadBtn.parentNode.replaceChild(newUploadBtn, uploadBtn);
        newUploadBtn.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });
    }
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С КОММЕНТАРИЯМИ (ГЛОБАЛЬНЫЕ) ==========

// Эта функция будет вызываться из render.js
function showCommentModal(itemId, itemName) {
    // Получаем текущий комментарий
    let currentComment = "";
    if (commentsCache.has(itemId) && commentsCache.get(itemId).comment) {
        currentComment = commentsCache.get(itemId).comment;
    } else if (isOnline) {
        // Пробуем загрузить с сервера, если нет в кэше
        getComment(itemId).then(commentData => {
            if (commentData && commentData.comment) {
                currentComment = commentData.comment;
            }
            renderCommentModal(itemId, itemName, currentComment);
        }).catch(() => {
            renderCommentModal(itemId, itemName, currentComment);
        });
        return;
    }
    renderCommentModal(itemId, itemName, currentComment);
}

function renderCommentModal(itemId, itemName, currentComment) {
    // Создаём или получаем модальное окно для комментария
    let modal = document.getElementById('commentModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'commentModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <button class="modal-close-btn" onclick="closeCommentModal()">×</button>
                <div class="modal-header">
                    <span>💬 Комментарий к товару</span>
                </div>
                <div id="commentModalContent">
                    <div class="comment-item-name" id="commentItemName" style="margin-bottom: 12px; font-weight: bold; color: var(--badge-text);"></div>
                    <textarea id="commentText" rows="5" style="width: 100%; padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-primary); font-size: 14px; resize: vertical;" placeholder="Введите комментарий к товару..."></textarea>
                    <div class="comment-last-updated" id="commentLastUpdated" style="font-size: 11px; color: var(--text-muted); margin-top: 8px;"></div>
                    <div class="edit-buttons" style="margin-top: 20px; display: flex; gap: 12px; justify-content: flex-end;">
                        <button class="edit-cancel-btn" onclick="closeCommentModal()">❌ Отмена</button>
                        <button class="edit-save-btn" onclick="saveCommentAndClose()">💾 Сохранить</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Заполняем данные
    document.getElementById('commentItemName').innerHTML = `📦 ${escapeHtml(itemName)} (ID: ${itemId})`;
    document.getElementById('commentText').value = currentComment;
    
    const lastUpdated = commentsCache.has(itemId) && commentsCache.get(itemId).lastUpdated 
        ? new Date(commentsCache.get(itemId).lastUpdated).toLocaleString('ru-RU')
        : null;
    const lastUpdatedEl = document.getElementById('commentLastUpdated');
    if (lastUpdatedEl) {
        lastUpdatedEl.innerHTML = lastUpdated ? `Последнее изменение: ${lastUpdated}` : '';
    }
    
    // Сохраняем itemId в атрибут модального окна
    modal.setAttribute('data-item-id', itemId);
    modal.setAttribute('data-item-name', itemName);
    
    modal.style.display = 'block';
}

function closeCommentModal() {
    const modal = document.getElementById('commentModal');
    if (modal) modal.style.display = 'none';
}

async function saveCommentAndClose() {
    const modal = document.getElementById('commentModal');
    if (!modal) return;
    
    const itemId = parseInt(modal.getAttribute('data-item-id'));
    const commentText = document.getElementById('commentText').value;
    
    if (isNaN(itemId)) return;
    
    const success = await saveComment(itemId, commentText);
    
    if (success) {
        if (typeof updateCommentIndicators === 'function') {
            updateCommentIndicators();
        }
        closeCommentModal();
    }
}

// ========== ФУНКЦИИ ДЛЯ ПОСТАВКИ ==========

function openSupplyModal() {
    // Заполняем селектор товарами
    const select = document.getElementById('supplyProductId');
    if (select) {
        select.innerHTML = '<option value="">Выберите товар</option>';
        const sortedProducts = [...originalCardsData].sort((a, b) => {
            const aStr = `${a.type} ${a.name}`;
            const bStr = `${b.type} ${b.name}`;
            return aStr.localeCompare(bStr, 'ru');
        });
        for (const product of sortedProducts) {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.type} ${product.name} (остаток: ${product.stock} шт)`;
            select.appendChild(option);
        }
    }
    
    // Очищаем поле количества
    const quantityInput = document.getElementById('supplyQuantity');
    if (quantityInput) quantityInput.value = '1';
    
    const modal = document.getElementById('supplyModal');
    if (modal) modal.style.display = 'block';
}

function closeSupplyModal() {
    const modal = document.getElementById('supplyModal');
    if (modal) modal.style.display = 'none';
}

// ИСПРАВЛЕННАЯ ФУНКЦИЯ (без рекурсии)
async function handleAddSupply() {
    const select = document.getElementById('supplyProductId');
    const itemId = parseInt(select?.value);
    const quantity = parseInt(document.getElementById('supplyQuantity')?.value) || 0;
    
    if (!itemId) {
        showToast("Выберите товар", false);
        return;
    }
    
    if (quantity < 1) {
        showToast("Количество должно быть больше 0", false);
        return;
    }
    
    const product = originalCardsData.find(c => c.id === itemId);
    if (!product) {
        showToast("Товар не найден", false);
        return;
    }
    
    // Вызываем API функцию addSupply (из api.js)
    const success = await window.addSupply(itemId, quantity);
    if (success) {
        closeSupplyModal();
    }
}

// ========== ФУНКЦИИ ДЛЯ ТЕХПОДДЕРЖКИ ==========

function openSupportModal() {
    const modal = document.getElementById('supportModal');
    if (modal) {
        document.getElementById('supportContact').value = '';
        document.getElementById('supportMessage').value = '';
        modal.style.display = 'block';
    }
}

function closeSupportModal() {
    const modal = document.getElementById('supportModal');
    if (modal) modal.style.display = 'none';
}

async function sendSupportRequest() {
    const contact = document.getElementById('supportContact').value.trim();
    const message = document.getElementById('supportMessage').value.trim();
    
    if (!message) {
        showToast("Напишите сообщение", false);
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('action', 'sendSupport');
        params.append('participant', CURRENT_USER.id);
        params.append('userId', CURRENT_USER.id);
        params.append('userName', CURRENT_USER.name);
        params.append('message', message);
        params.append('contact', contact);
        
        const response = await fetch(CENTRAL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast("Сообщение отправлено! Спасибо.", true);
            closeSupportModal();
        } else {
            showToast("Ошибка: " + (result.error || "неизвестная"), false);
        }
    } catch(e) {
        console.error("Support error:", e);
        showToast("Ошибка отправки. Попробуйте позже.", false);
    }
}

// ========== ЭКСПОРТ ФУНКЦИЙ В ГЛОБАЛЬНУЮ ОБЛАСТЬ ==========
window.showCommentModal = showCommentModal;
window.closeCommentModal = closeCommentModal;
window.saveCommentAndClose = saveCommentAndClose;
window.handleAddSupply = handleAddSupply;
window.openSupportModal = openSupportModal;
window.closeSupportModal = closeSupportModal;
window.sendSupportRequest = sendSupportRequest;

// Экспортируем функции имперсонации в глобальную область (если они есть в auth.js)
window.impersonateUser = typeof impersonateUser !== 'undefined' ? impersonateUser : null;
window.stopImpersonating = typeof stopImpersonating !== 'undefined' ? stopImpersonating : null;
window.getRealUserParam = typeof getRealUserParam !== 'undefined' ? getRealUserParam : () => "";
window.showImpersonateUI = typeof showImpersonateUI !== 'undefined' ? showImpersonateUI : null;
