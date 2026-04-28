// ========== РЕДАКТИРОВАНИЕ ==========

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
        document.getElementById('editProductModal').style.display = 'block';
    } else {
        showToast("Товар не найден", false);
    }
}

function closeEditProductModal() {
    document.getElementById('editProductModal').style.display = 'none';
    currentEditId = null;
}

async function saveProductChanges() {
    if (currentEditId === null) return;
    
    const newType = document.getElementById('editType').value.trim();
    const newName = document.getElementById('editName').value.trim();
    const newStock = parseInt(document.getElementById('editStock').value);
    const newTotal = parseInt(document.getElementById('editTotal').value);
    const newPrice = parseFloat(document.getElementById('editPrice').value);
    const newCost = parseFloat(document.getElementById('editCost').value);
    
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
    
    // Обновляем в originalCardsData
    const card = originalCardsData.find(c => c.id === currentEditId);
    if (card) {
        card.type = newType;
        card.name = newName;
        card.stock = newStock;
        card.total = newTotal;
        card.price = newPrice;
        card.cost = newCost;
        filterAndSort();
    }
    
    // Обновляем в DOM
    const cardElement = document.querySelector(`.card[data-id="${currentEditId}"]`);
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
    
    if (!isOnline) {
        addPendingOperation("updateFullItem", `&id=${currentEditId}&type=${encodeURIComponent(newType)}&name=${encodeURIComponent(newName)}&stock=${newStock}&total=${newTotal}&price=${newPrice}&cost=${newCost}`);
        showToast(`Товар "${newName}" обновлён (будет синхронизировано при восстановлении соединения)`, true);
        closeEditProductModal();
        return;
    }
    
    try {
        const response = await fetch(buildApiUrl("updateFullItem", `&id=${currentEditId}&type=${encodeURIComponent(newType)}&name=${encodeURIComponent(newName)}&stock=${newStock}&total=${newTotal}&price=${newPrice}&cost=${newCost}`));
        const result = await response.json();
        if (!result.success) {
            showToast("Ошибка: " + (result.error || "неизвестная"), false);
        } else {
            showToast(`Товар "${newName}" обновлён`, true);
            closeEditProductModal();
        }
    } catch (e) {
        console.error(e);
        addPendingOperation("updateFullItem", `&id=${currentEditId}&type=${encodeURIComponent(newType)}&name=${encodeURIComponent(newName)}&stock=${newStock}&total=${newTotal}&price=${newPrice}&cost=${newCost}`);
        showToast(`Товар "${newName}" обновлён (будет синхронизировано при восстановлении соединения)`, true);
        closeEditProductModal();
    }
}
