// В checkRulesForCart() — работа с id
function checkRulesForCart() {
    const cartItems = Object.entries(cart);
    if (cartItems.length === 0 || !originalCardsData.length) return [];
    const cartInfo = {};
    let totalPrice = 0;
    for (const [idStr, qty] of cartItems) {
        if (qty === 0) continue;
        const id = parseInt(idStr);
        const card = originalCardsData.find(c => c.id === id);
        if (card) {
            if (!cartInfo[card.id]) cartInfo[card.id] = { qty: 0, price: card.price, type: card.type, name: card.name };
            cartInfo[card.id].qty += qty;
            totalPrice += qty * card.price;
        }
    }
    const typeQty = {};
    for (const [id, info] of Object.entries(cartInfo)) if (info.type) typeQty[info.type] = (typeQty[info.type] || 0) + info.qty;
    const activeRules = [];
    for (const rule of rulesList) {
        if (rule.active === false) continue;
        let isActive = false;
        let detailText = "";
        if (rule.type === 'type') { const qty = typeQty[rule.condition.typeName] || 0; if (qty >= rule.condition.minQty) { isActive = true; detailText = `(в корзине ${qty} шт товаров типа "${rule.condition.typeName}", нужно от ${rule.condition.minQty})`; } }
        else if (rule.type === 'product') { 
            let totalQty = 0; 
            for (const productId of rule.condition.productIds) {
                totalQty += cartInfo[productId]?.qty || 0;
            }
            if (totalQty >= rule.condition.minQty) { isActive = true; detailText = `(в корзине ${totalQty} шт товаров из списка, нужно от ${rule.condition.minQty})`; } 
        }
        else if (rule.type === 'price') { if (totalPrice >= rule.condition.minSum) { isActive = true; detailText = `(сумма ${totalPrice} ₽, нужно от ${rule.condition.minSum} ₽)`; } }
        else if (rule.type === 'bonus') { isActive = true; detailText = ""; }
        if (isActive) activeRules.push({ icon: rule.icon || "✨", message: rule.message, condition: detailText });
    }
    return activeRules;
}

// В renderProductMultiSelect() — работа с id
function renderProductMultiSelect(preserveScroll = false) {
    const container = document.getElementById('productMultiSelectContainer');
    if (!container) return;
    if (preserveScroll) {
        const scrollContainer = container.querySelector('.multi-select-container');
        if (scrollContainer) scrollPosition = scrollContainer.scrollTop;
    }
    let html = '<div class="multi-select-container">';
    originalCardsData.forEach(card => {
        const isSelected = selectedProducts.has(card.id);
        html += `<div class="multi-select-item ${isSelected ? 'selected' : ''}" onclick="toggleProductSelection(${card.id})">
                    <span class="multi-select-item-label">${escapeHtml(card.name)}</span>
                    ${isSelected ? '<span class="selected-mark">✓</span>' : ''}
                </div>`;
    });
    html += '</div><div id="selectedProductsDisplay"></div>';
    container.innerHTML = html;
    if (preserveScroll) {
        const scrollContainer = container.querySelector('.multi-select-container');
        if (scrollContainer) scrollContainer.scrollTop = scrollPosition;
    }
    updateSelectedProductsDisplay();
}
