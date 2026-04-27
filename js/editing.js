// ========== РЕДАКТИРОВАНИЕ ==========
function openEditProductModal(index) {
    currentEditIndex = index;
    const card = originalCardsData[index];
    if (card) {
        document.getElementById('editTotal').value = card.total;
        document.getElementById('editStock').value = card.stock;
        document.getElementById('editProductModal').style.display = 'block';
    }
}

function closeEditProductModal() {
    document.getElementById('editProductModal').style.display = 'none';
    currentEditIndex = null;
}

async function saveProductChanges() {
    if (currentEditIndex === null) return;
    const card = originalCardsData[currentEditIndex];
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
        addPendingOperation("updateTotal", `&row=${currentEditIndex}&newTotal=${newTotal}&newStock=${newStock}`);
        showToast(`Товар "${card.name}" обновлён (будет синхронизировано при восстановлении соединения)`, true);
        closeEditProductModal();
        return;
    }
    
    try {
        await fetch(buildApiUrl("updateTotal", `&row=${currentEditIndex}&newTotal=${newTotal}&newStock=${newStock}`));
        showToast(`Товар "${card.name}" обновлён`, true);
    } catch (e) {
        console.error(e);
        addPendingOperation("updateTotal", `&row=${currentEditIndex}&newTotal=${newTotal}&newStock=${newStock}`);
        showToast(`Товар "${card.name}" обновлён (будет синхронизировано при восстановлении соединения)`, true);
    }
    closeEditProductModal();
}
