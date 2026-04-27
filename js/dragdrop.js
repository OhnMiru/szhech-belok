// В saveCustomOrder()
function saveCustomOrder() {
    const order = [];
    document.querySelectorAll('#cards-container .card').forEach(card => {
        const idAttr = card.getAttribute('data-id');
        if (idAttr) {
            const id = parseInt(idAttr);
            order.push(id);
        }
    });
    if (order.length === originalCardsData.length) {
        customOrder = order;
        localStorage.setItem('merch_custom_order', JSON.stringify(customOrder));
        syncCustomOrderToServer();
    }
}

// В dropHandler()
function dropHandler(e, dropIndex) {
    if (currentSortBy !== 'custom') return;
    e.preventDefault();
    const card = e.target.closest('.card');
    if (card) card.classList.remove('drag-over');
    if (dragStartIndex !== null && dragStartIndex !== dropIndex) {
        const cards = [...currentFilteredData];
        const [movedCard] = cards.splice(dragStartIndex, 1);
        cards.splice(dropIndex, 0, movedCard);
        currentFilteredData = cards;
        renderCards();
        const newOrder = [];
        currentFilteredData.forEach(card => {
            newOrder.push(card.id);
        });
        customOrder = newOrder;
        localStorage.setItem('merch_custom_order', JSON.stringify(customOrder));
        syncCustomOrderToServer();
    }
    dragStartIndex = null;
}

// В applyCustomOrder()
function applyCustomOrder(data) {
    if (!customOrder.length || customOrder.length !== data.length) return data;
    const ordered = [];
    for (const id of customOrder) {
        const found = data.find(card => card.id === id);
        if (found) ordered.push(found);
    }
    for (const item of data) {
        if (!ordered.find(c => c.id === item.id)) ordered.push(item);
    }
    return ordered;
}
