// ========== РЕДАКТИРОВАНИЕ ==========
function openEditProductModal(id) {
    console.log("openEditProductModal started, id:", id);
    console.log("Type of id:", typeof id);
    
    const numericId = parseInt(id);
    console.log("numericId:", numericId);
    
    currentEditId = numericId;
    console.log("currentEditId set to:", currentEditId);
    
    // Просто проверяем, что переменная установилась
    setTimeout(() => {
        console.log("After timeout, currentEditId is:", currentEditId);
    }, 100);
    
    // Показываем alert для проверки
    alert("Редактирование товара ID: " + numericId);
}

function closeEditProductModal() {
    document.getElementById('editProductModal').style.display = 'none';
    currentEditId = null;
}

async function saveProductChanges() {
    if (currentEditId === null) return;
    const card = originalCardsData.find(c => c.id === currentEditId);
    if (!card) {
        showToast("Товар не найден", false);
        closeEditProductModal();
        return;
    }
    
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
    
    // Сохраняем старые значения
    const oldType = card.type;
    const oldName = card.name;
    const oldStock = card.stock;
    const oldTotal = card.total;
    const oldPrice = card.price;
    const oldCost = card.cost;
    
    // Обновляем локально
    card.type = newType;
    card.name = newName;
    card.stock = newStock;
    card.total = newTotal;
    card.price = newPrice;
    card.cost = newCost;
    
    filterAndSort();
    
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
            // Откат
            card.type = oldType;
            card.name = oldName;
            card.stock = oldStock;
            card.total = oldTotal;
            card.price = oldPrice;
            card.cost = oldCost;
            filterAndSort();
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
window.openEditProductModal = openEditProductModal;
