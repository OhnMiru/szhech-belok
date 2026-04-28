// ========== РЕДАКТИРОВАНИЕ ==========
function openEditProductModal(id) {
    console.log("openEditProductModal called with id:", id);
    currentEditId = id;
    const card = originalCardsData.find(c => c.id === id);
    console.log("Found card:", card);
    
    if (card) {
        const titleElement = document.getElementById('editTitle');
        if (titleElement) {
            titleElement.textContent = `✏️ Редактирование товара №${card.id}`;
        }
        
        const typeInput = document.getElementById('editType');
        const nameInput = document.getElementById('editName');
        const stockInput = document.getElementById('editStock');
        const totalInput = document.getElementById('editTotal');
        const priceInput = document.getElementById('editPrice');
        const costInput = document.getElementById('editCost');
        
        console.log("Input elements found:", {
            type: !!typeInput,
            name: !!nameInput,
            stock: !!stockInput,
            total: !!totalInput,
            price: !!priceInput,
            cost: !!costInput
        });
        
        if (typeInput) typeInput.value = card.type || "";
        if (nameInput) nameInput.value = card.name || "";
        if (stockInput) stockInput.value = card.stock;
        if (totalInput) totalInput.value = card.total;
        if (priceInput) priceInput.value = card.price;
        if (costInput) costInput.value = card.cost || 0;
        
        const modal = document.getElementById('editProductModal');
        if (modal) modal.style.display = 'block';
    } else {
        console.error("Card not found for id:", id);
    }
}

function closeEditProductModal() {
    const modal = document.getElementById('editProductModal');
    if (modal) modal.style.display = 'none';
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
    
    // Сохраняем старые значения на случай отката при ошибке
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
            // Откат при ошибке
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
