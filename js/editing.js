// ========== РЕДАКТИРОВАНИЕ ==========

function openEditProductModal(id) {
    console.log("openEditProductModal вызвана, id:", id);
    
    const numericId = parseInt(id);
    window.currentEditId = numericId;
    
    // Берём данные прямо из DOM
    const cardElement = document.querySelector(`.card[data-id="${numericId}"]`);
    if (!cardElement) {
        showToast("Товар не найден", false);
        return;
    }
    
    const nameElement = cardElement.querySelector('.name');
    const typeBadge = cardElement.querySelector('.type-badge');
    const stockSpan = cardElement.querySelector('.stock');
    const totalSpan = cardElement.querySelector('.total');
    const priceSpan = cardElement.querySelector('.price');
    
    const type = typeBadge ? typeBadge.textContent : "";
    const name = nameElement ? nameElement.textContent : "";
    const stock = stockSpan ? parseInt(stockSpan.textContent.replace('Остаток:', '').replace('шт', '').trim()) : 0;
    const total = totalSpan ? parseInt(totalSpan.textContent.replace('📦 Всего:', '').replace('шт', '').trim()) : 0;
    const price = priceSpan ? parseInt(priceSpan.textContent.replace('💰 Цена:', '').replace('₽', '').trim()) : 0;
    
    const titleEl = document.getElementById('editTitle');
    const typeEl = document.getElementById('editType');
    const nameEl = document.getElementById('editName');
    const stockEl = document.getElementById('editStock');
    const totalEl = document.getElementById('editTotal');
    const priceEl = document.getElementById('editPrice');
    const costEl = document.getElementById('editCost');
    const modalEl = document.getElementById('editProductModal');
    
    if (titleEl) titleEl.textContent = `✏️ Редактирование товара №${numericId}`;
    if (typeEl) typeEl.value = type;
    if (nameEl) nameEl.value = name;
    if (stockEl) stockEl.value = stock;
    if (totalEl) totalEl.value = total;
    if (priceEl) priceEl.value = price;
    if (costEl) costEl.value = 0;
    if (modalEl) modalEl.style.display = 'block';
}

function closeEditProductModal() {
    const modalEl = document.getElementById('editProductModal');
    if (modalEl) modalEl.style.display = 'none';
    window.currentEditId = null;
}

async function saveProductChanges() {
    if (window.currentEditId === null) return;
    
    const newType = document.getElementById('editType')?.value.trim() || "";
    const newName = document.getElementById('editName')?.value.trim() || "";
    const newStock = parseInt(document.getElementById('editStock')?.value || 0);
    const newTotal = parseInt(document.getElementById('editTotal')?.value || 0);
    const newPrice = parseFloat(document.getElementById('editPrice')?.value || 0);
    const newCost = parseFloat(document.getElementById('editCost')?.value || 0);
    
    if (!newName) {
        showToast("Название товара обязательно", false);
        return;
    }
    if (isNaN(newStock) || isNaN(newTotal) || newStock < 0 || newTotal < 0 || newStock > newTotal) {
        showToast("Некорректные значения остатка или общего количества", false);
        return;
    }
    if (isNaN(newPrice) || newPrice < 0) {
        showToast("Некорректная цена", false);
        return;
    }
    if (isNaN(newCost) || newCost < 0) {
        showToast("Некорректная себестоимость", false);
        return;
    }
    
    // Обновляем в DOM
    const cardElement = document.querySelector(`.card[data-id="${window.currentEditId}"]`);
    if (cardElement) {
        const nameElement = cardElement.querySelector('.name');
        const typeBadge = cardElement.querySelector('.type-badge');
        const stockSpan = cardElement.querySelector('.stock');
        const totalSpan = cardElement.querySelector('.total');
        const priceSpan = cardElement.querySelector('.price');
        
        if (nameElement) nameElement.textContent = newName;
        if (typeBadge) typeBadge.textContent = newType;
        if (stockSpan) stockSpan.textContent = `Остаток: ${newStock} шт`;
        if (totalSpan) totalSpan.textContent = `📦 Всего: ${newTotal} шт`;
        if (priceSpan) priceSpan.textContent = `💰 Цена: ${newPrice} ₽`;
        
        if (newStock === 0) cardElement.classList.add('out-of-stock');
        else cardElement.classList.remove('out-of-stock');
    }
    
    // Обновляем в originalCardsData
    const card = originalCardsData.find(c => c.id === window.currentEditId);
    if (card) {
        card.type = newType;
        card.name = newName;
        card.stock = newStock;
        card.total = newTotal;
        card.price = newPrice;
        card.cost = newCost;
        filterAndSort();
    }
    
    if (!isOnline) {
        addPendingOperation("updateFullItem", `&id=${window.currentEditId}&type=${encodeURIComponent(newType)}&name=${encodeURIComponent(newName)}&stock=${newStock}&total=${newTotal}&price=${newPrice}&cost=${newCost}`);
        showToast(`Товар "${newName}" обновлён (будет синхронизировано при восстановлении соединения)`, true);
        closeEditProductModal();
        return;
    }
    
    try {
        const response = await fetch(buildApiUrl("updateFullItem", `&id=${window.currentEditId}&type=${encodeURIComponent(newType)}&name=${encodeURIComponent(newName)}&stock=${newStock}&total=${newTotal}&price=${newPrice}&cost=${newCost}`));
        const result = await response.json();
        if (!result.success) {
            showToast("Ошибка: " + (result.error || "неизвестная"), false);
        } else {
            showToast(`Товар "${newName}" обновлён`, true);
            closeEditProductModal();
        }
    } catch (e) {
        console.error(e);
        addPendingOperation("updateFullItem", `&id=${window.currentEditId}&type=${encodeURIComponent(newType)}&name=${encodeURIComponent(newName)}&stock=${newStock}&total=${newTotal}&price=${newPrice}&cost=${newCost}`);
        showToast(`Товар "${newName}" обновлён (будет синхронизировано при восстановлении соединения)`, true);
        closeEditProductModal();
    }
}

// Делаем функции глобальными
window.openEditProductModal = openEditProductModal;
window.closeEditProductModal = closeEditProductModal;
window.saveProductChanges = saveProductChanges;
