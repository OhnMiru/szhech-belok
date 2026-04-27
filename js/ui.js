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
