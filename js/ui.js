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
        
        // Загружаем фото в превью
        loadPhotoPreview(id);
        
        document.getElementById('editProductModal').style.display = 'block';
        
        // ВАЖНО: инициализируем обработчики ПОСЛЕ того как модалка открылась
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
            .catch(() => {
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
    
    const url = await getPhotoUrl(itemId);
    
    if (url) {
        container.innerHTML = `<img src="${url}" alt="Фото товара" style="max-width: 100%; max-height: 150px; border-radius: 8px;">`;
        const deleteBtn = document.getElementById('deletePhotoBtn');
        if (deleteBtn) deleteBtn.style.display = 'inline-flex';
    } else {
        container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 150px; background: var(--badge-bg); border-radius: 8px; color: var(--text-muted);">📷 Нет фото</div>`;
        const deleteBtn = document.getElementById('deletePhotoBtn');
        if (deleteBtn) deleteBtn.style.display = 'none';
    }
}

async function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast("Пожалуйста, выберите изображение", false);
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast("Файл слишком большой. Максимум 5 МБ", false);
        return;
    }
    
    if (!currentEditId) {
        showToast("Товар не выбран", false);
        return;
    }
    
    showToast("Загрузка фото...", true);
    const success = await uploadPhoto(currentEditId, file);
    
    if (success) {
        await loadPhotoPreview(currentEditId);
        document.getElementById('photoFileInput').value = '';
    }
}

async function handleDeletePhoto() {
    if (!currentEditId) {
        showToast("Товар не выбран", false);
        return;
    }
    
    if (confirm("Удалить фото товара?")) {
        const success = await deletePhoto(currentEditId);
        if (success) {
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
    
    const url = await getPhotoUrl(itemId);
    
    if (url) {
        content.innerHTML = `<img src="${url}" alt="Фото товара" style="max-width: 100%; max-height: 60vh; border-radius: 12px;">`;
    } else {
        content.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">📷 Фото не добавлено</div>`;
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
        uploadBtn.removeEventListener('click', () => {});
        uploadBtn.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });
    }
}
