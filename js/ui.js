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
        document.getElementById('editTotal').value = card.total;
        document.getElementById('editStock').value = card.stock;
        document.getElementById('editProductModal').style.display = 'block';
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
    // Заполняем выпадающий список типов
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
    
    // Очищаем поля
    document.getElementById('addItemName').value = '';
    document.getElementById('addItemTotal').value = '0';
    document.getElementById('addItemStock').value = '0';
    document.getElementById('addItemPrice').value = '0';
    document.getElementById('addItemCost').value = '0';
    
    // Скрываем поле нового типа
    const newTypeInput = document.getElementById('addItemNewType');
    if (newTypeInput) {
        newTypeInput.style.display = 'none';
        newTypeInput.value = '';
    }
    
    // Показываем селект
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
        // Скрываем селект, показываем поле ввода
        typeSelect.style.display = 'none';
        newTypeInput.style.display = 'flex';
        toggleBtn.textContent = '📋';
        newTypeInput.focus();
    } else {
        // Показываем селект, скрываем поле ввода
        typeSelect.style.display = 'flex';
        newTypeInput.style.display = 'none';
        newTypeInput.value = '';
        toggleBtn.textContent = '➕';
        // Обновляем список типов
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
        // Если выбран "добавить новый", открываем поле ввода
        if (typeSelect.style.display !== 'none') {
            toggleNewTypeInput();
        }
    }
}

async function addNewItem() {
    // Получаем тип
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
    
    // Получаем название
    const name = document.getElementById('addItemName').value.trim();
    if (name === "") {
        showToast("Введите название товара", false);
        return;
    }
    
    // Получаем количество
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
    
    // Получаем цену
    const price = parseFloat(document.getElementById('addItemPrice').value) || 0;
    if (price < 0) {
        showToast("Цена не может быть отрицательной", false);
        return;
    }
    
    // Получаем себестоимость
    const cost = parseFloat(document.getElementById('addItemCost').value) || 0;
    if (cost < 0) {
        showToast("Себестоимость не может быть отрицательной", false);
        return;
    }
    
    // Добавляем товар
    await addNewItem(type, name, total, stock, price, cost);
    
    // Закрываем модалку
    closeAddItemModal();
}
