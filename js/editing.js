// ========== РЕДАКТИРОВАНИЕ ==========

function openEditProductModal(id) {
    console.log("openEditProductModal вызвана, id:", id);
    
    const numericId = parseInt(id);
    window.currentEditId = numericId;
    
    // Ищем карточку в originalCardsData (самый надёжный способ)
    let card = originalCardsData.find(c => c.id === numericId);
    
    // Если не нашли в данных, пробуем из DOM
    if (!card) {
        const cardElement = document.querySelector(`.card[data-id="${numericId}"]`);
        if (cardElement) {
            const nameElement = cardElement.querySelector('.name');
            const typeBadge = cardElement.querySelector('.type-badge');
            const stockSpan = cardElement.querySelector('.stock');
            const totalSpan = cardElement.querySelector('.total');
            const priceSpan = cardElement.querySelector('.price');
            
            card = {
                id: numericId,
                name: nameElement ? nameElement.textContent : "",
                type: typeBadge ? typeBadge.textContent : "",
                stock: stockSpan ? parseInt(stockSpan.textContent.replace('Остаток:', '').replace('шт', '').trim()) : 0,
                total: totalSpan ? parseInt(totalSpan.textContent.replace('📦 Всего:', '').replace('шт', '').trim()) : 0,
                price: priceSpan ? parseInt(priceSpan.textContent.replace('💰 Цена:', '').replace('₽', '').trim()) : 0,
                cost: 0
            };
        }
    }
    
    console.log("Найденная карточка:", card);
    
    if (card) {
        const titleEl = document.getElementById('editTitle');
        const typeEl = document.getElementById('editType');
        const nameEl = document.getElementById('editName');
        const stockEl = document.getElementById('editStock');
        const totalEl = document.getElementById('editTotal');
        const priceEl = document.getElementById('editPrice');
        const costEl = document.getElementById('editCost');
        const modalEl = document.getElementById('editProductModal');
        
        console.log("Найденные элементы:", {
            title: !!titleEl,
            type: !!typeEl,
            name: !!nameEl,
            stock: !!stockEl,
            total: !!totalEl,
            price: !!priceEl,
            cost: !!costEl,
            modal: !!modalEl
        });
        
        if (titleEl) titleEl.textContent = `✏️ Редактирование товара №${card.id}`;
        if (typeEl) typeEl.value = card.type || "";
        if (nameEl) nameEl.value = card.name || "";
        if (stockEl) stockEl.value = card.stock;
        if (totalEl) totalEl.value = card.total;
        if (priceEl) priceEl.value = card.price;
        if (costEl) costEl.value = card.cost || 0;
        if (modalEl) modalEl.style.display = 'block';
        
        console.log("Значения полей установлены");
    } else {
        console.error("Товар не найден, id:", numericId);
        showToast("Товар не найден", false);
    }
}

function closeEditProductModal() {
    const modalEl = document.getElementById('editProductModal');
    if (modalEl) modalEl.style.display = 'none';
    window.currentEditId = null;
}

async function saveProductChanges() {
    if (window.currentEditId === null) {
        showToast("Товар не выбран", false);
        return;
    }
    
    const newType = document.getElementById('editType')?.value.trim() || "";
    const newName = document.getElementById('editName')?.value.trim() || "";
    const newStock = parseInt(document.getElementById('editStock')?.value || 0);
    const newTotal = parseInt(document.getElementById('editTotal')?.value || 0);
    const newPrice = parseFloat(document.getElementById('editPrice')?.value || 0);
    const newCost = parseFloat(document.getElementById('editCost')?.value || 0);
    
    console.log("Сохраняемые значения:", { newType, newName, newStock, newTotal, newPrice, newCost });
    
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
        
        // Обновляем data-id на случай, если он есть на кнопке
        const editBtn = cardElement.querySelector('.edit-icon');
        if (editBtn) editBtn.setAttribute('data-id', window.currentEditId);
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
