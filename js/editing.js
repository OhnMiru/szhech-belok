// ========== РЕДАКТИРОВАНИЕ ==========
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

async function saveProductChanges() {
    if (currentEditId === null) return;
    const card = originalCardsData.find(c => c.id === currentEditId);
    const newTotal = parseInt(document.getElementById('editTotal').value);
    const newStock = parseInt(document.getElementById('editStock').value);
    if (isNaN(newTotal) || isNaN(newStock) || newTotal < 0 || newStock < 0 || newStock > newTotal) {
        showToast("Некорректные значения", false);
        return;
    }
    card.total = newTotal;
    card.stock = newStock;
    filterAndSort();
    
    if (!isOnline) {
        addPendingOperation("updateTotal", `&id=${currentEditId}&newTotal=${newTotal}&newStock=${newStock}`);
        showToast(`Товар "${card.name}" обновлён (будет синхронизировано при восстановлении соединения)`, true);
        closeEditProductModal();
        return;
    }
    
    try {
        await fetch(buildApiUrl("updateTotal", `&id=${currentEditId}&newTotal=${newTotal}&newStock=${newStock}`));
        showToast(`Товар "${card.name}" обновлён`, true);
    } catch (e) {
        console.error(e);
        addPendingOperation("updateTotal", `&id=${currentEditId}&newTotal=${newTotal}&newStock=${newStock}`);
        showToast(`Товар "${card.name}" обновлён (будет синхронизировано при восстановлении соединения)`, true);
    }
    closeEditProductModal();
}
