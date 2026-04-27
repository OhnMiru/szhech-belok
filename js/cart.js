// ========== КОРЗИНА ==========
function updateCardBadges() {
    document.querySelectorAll('.card').forEach(card => {
        const idAttr = card.getAttribute('data-id');
        if (idAttr) {
            const id = parseInt(idAttr);
            let badge = card.querySelector('.cart-qty-badge');
            if (cart.hasOwnProperty(id) && cart[id] > 0) {
                if (!badge) { badge = document.createElement('div'); badge.className = 'cart-qty-badge'; card.style.position = 'relative'; card.appendChild(badge); }
                badge.textContent = cart[id];
                badge.style.background = 'var(--btn-bg)';
            } else { if (badge) badge.remove(); }
        }
    });
}

function getBestDiscountForItem(id, originalPrice, qty, subtotal) {
    let finalPrice = originalPrice;
    let discountValue = 0;
    let discountType = null;
    if (itemDiscounts[id]) {
        const disc = itemDiscounts[id];
        discountType = disc.type;
        if (disc.type === 'percent') { finalPrice = originalPrice * (1 - disc.value / 100); discountValue = disc.value; }
        else if (disc.type === 'fixed') { finalPrice = Math.max(0, originalPrice - disc.value); discountValue = disc.value; }
    }
    return { price: finalPrice, discountValue: discountValue, discountType: discountType };
}

function updateCartUI() {
    const totalPositiveCount = Object.values(cart).reduce((a, b) => a + (b > 0 ? b : 0), 0);
    const cartCountSpan = document.getElementById('cartCount');
    if (cartCountSpan) cartCountSpan.textContent = totalPositiveCount;
    const cartItemsDiv = document.getElementById('cart-items-list');
    const cartTotalDiv = document.getElementById('cart-total');
    const cartActionsDiv = document.getElementById('cart-actions');
    const discountPanelDiv = document.getElementById('discount-panel');
    if (!cartItemsDiv) return;
    const hasAny = Object.keys(cart).length > 0;
    if (discountPanelDiv) discountPanelDiv.style.display = hasAny ? 'block' : 'none';
    if (!hasAny) {
        cartItemsDiv.innerHTML = '<div class="empty-cart">🍌 Корзина пуста</div>';
        if (cartTotalDiv) cartTotalDiv.style.display = 'none';
        if (cartActionsDiv) cartActionsDiv.style.display = 'none';
        updateCardBadges();
        return;
    }
    let discountHtml = `<div class="discount-section"><div class="discount-header" onclick="toggleDiscountPanel()"><span class="discount-title">🎯 Скидки</span><span class="discount-chevron" id="discount-chevron">▼</span></div>
            <div id="discount-content" class="discount-content" style="display: ${discountPanelOpen ? 'block' : 'none'};">
                <div class="discount-group"><div class="discount-row">
                    <div class="discount-custom-select"><div class="discount-custom-select-trigger" id="itemDiscountSelectTrigger" onclick="event.stopPropagation(); toggleItemDiscountSelect()">%</div>
                    <div class="discount-custom-select-dropdown" id="itemDiscountSelectDropdown"><div class="discount-select-option" onclick="selectItemDiscountType('percent', '%')">%</div><div class="discount-select-option" onclick="selectItemDiscountType('fixed', '₽')">₽</div></div>
                    <input type="hidden" id="itemDiscountTypeSelect" data-value="percent"></div>
                    <div class="discount-amount-control"><input type="number" id="itemDiscountValue" class="discount-amount-input" placeholder="Сумма" value="0" onchange="updateItemDiscountFromInput()"><button class="discount-step-btn" onclick="changeItemDiscountValue(-1)">−</button><button class="discount-step-btn" onclick="changeItemDiscountValue(1)">+</button></div>
                    <button class="discount-products-btn" onclick="toggleDiscountProductsList()">Товары</button><button class="discount-all-btn" onclick="selectAllProductsForDiscount()">Всё</button><button class="discount-none-btn" onclick="selectNoneProductsForDiscount()">Ничего</button>
                </div><div id="productDiscountList" style="display: none; margin-top: 8px;"></div></div>
                <div class="discount-buttons-row"><button class="discount-action-btn cancel-btn" onclick="closeDiscountPanel()">Отмена</button><button class="discount-action-btn reset-btn" onclick="resetItemDiscounts()">Сбросить скидки</button><button class="discount-action-btn apply-btn" onclick="applyItemDiscount()">Применить</button></div>
            </div></div>`;
    if (discountPanelDiv) discountPanelDiv.innerHTML = discountHtml;
    const activeRules = checkRulesForCart();
    let total = 0;
    let html = '';
    if (activeRules.length > 0) {
        html += `<div style="background: var(--badge-bg); border-radius: 16px; padding: 12px; margin-bottom: 16px; border-left: 4px solid var(--btn-bg);"><div style="font-size: 13px; font-weight: bold; margin-bottom: 8px; color: var(--badge-text);">✨ Активные правила ✨</div>`;
        for (const rule of activeRules) html += `<div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary); padding: 4px 0;"><span style="font-size: 16px;">${escapeHtml(rule.icon)}</span><span><span class="rule-text-bold">${escapeHtml(rule.message)}</span> <span class="rule-text-normal">${escapeHtml(rule.condition)}</span></span></div>`;
        html += `</div>`;
    }
    let subtotal = 0;
    for (const [idStr, qty] of Object.entries(cart)) { const id = parseInt(idStr); const card = originalCardsData.find(c => c.id === id); if (card) subtotal += qty * card.price; }
    for (const [idStr, qty] of Object.entries(cart)) {
        const id = parseInt(idStr);
        const card = originalCardsData.find(c => c.id === id);
        if (!card) continue;
        const best = getBestDiscountForItem(id, card.price, qty, subtotal);
        const originalItemTotal = card.price * qty;
        const discountedItemTotal = best.price * qty;
        total += discountedItemTotal;
        const isZero = qty === 0;
        const hasDiscount = best.discountValue > 0;
        let discountText = '';
        if (hasDiscount) {
            if (best.discountType === 'percent') discountText = `<div style="font-size: 11px; color: var(--profit-positive);">Скидка: ${best.discountValue}%</div>`;
            else if (best.discountType === 'fixed') discountText = `<div style="font-size: 11px; color: var(--profit-positive);">Скидка: ${best.discountValue * qty} ₽</div>`;
        }
        html += `<div class="cart-item ${isZero ? 'disabled' : ''}"><div class="cart-item-info"><div class="cart-item-name">${escapeHtml(card.name)}</div>
                <div class="cart-item-price">${card.price} ₽ × ${qty} = ${hasDiscount ? `<span class="strikethrough">${originalItemTotal.toFixed(2)} ₽</span> ${discountedItemTotal.toFixed(2)} ₽` : `${originalItemTotal.toFixed(2)} ₽`}</div>${discountText}</div>
                <div class="cart-item-quantity"><button class="cart-qty-btn" onclick="changeCartQty(${id}, -1)" ${isZero ? 'disabled' : ''}>−</button><span class="cart-item-qty">${qty}</span><button class="cart-qty-btn" onclick="changeCartQty(${id}, 1)">+</button><button class="cart-item-remove" onclick="removeFromCart(${id})">🗑</button></div></div>`;
    }
    cartItemsDiv.innerHTML = html;
    if (cartTotalDiv) {
        cartTotalDiv.style.display = 'block';
        const hasAnyDiscount = Object.values(itemDiscounts).length > 0;
        if (hasAnyDiscount) { let totalDiscountRub = subtotal - total; cartTotalDiv.innerHTML = `<span class="strikethrough">${subtotal.toFixed(2)} ₽</span> ${Math.max(0, total).toFixed(2)} ₽ (скидка ${totalDiscountRub.toFixed(2)} ₽)`; }
        else { cartTotalDiv.innerHTML = `🍌 Итого: ${Math.max(0, total).toFixed(2)} ₽`; }
    }
    if (cartActionsDiv && totalPositiveCount > 0) cartActionsDiv.style.display = 'flex';
    else if (cartActionsDiv) cartActionsDiv.style.display = 'none';
    updateCardBadges();
}

function addToCart(id) {
    const card = originalCardsData.find(c => c.id === id);
    if (!card) return;
    if (card.stock <= 0) { showToast(`${card.name} закончился!`, false); return; }
    const currentQty = cart[id] || 0;
    if (currentQty + 1 > card.stock) { showToast(`Нельзя добавить больше, чем есть (${card.stock} шт)`, false); return; }
    cart[id] = currentQty + 1;
    updateCartUI();
    showToast(`${card.name} +1`, true);
}

function changeCartQty(id, delta) {
    const card = originalCardsData.find(c => c.id === id);
    if (!card) return;
    const currentQty = cart[id] || 0;
    const newQty = currentQty + delta;
    if (newQty < 0) return;
    if (newQty > card.stock) { showToast(`Нельзя добавить больше, чем есть (${card.stock} шт)`, false); return; }
    if (newQty === 0) delete cart[id];
    else cart[id] = newQty;
    updateCartUI();
}

function removeFromCart(id) {
    delete cart[id];
    updateCartUI();
    const card = originalCardsData.find(c => c.id === id);
    if (card) showToast(`${card.name} удалён из корзины`, true);
}

function clearCart() {
    cart = {};
    itemDiscounts = {};
    selectedDiscountProducts.clear();
    updateCartUI();
    showToast(`Корзина очищена`, true);
}

function giftCart() {
    const items = Object.entries(cart).filter(([_, qty]) => qty > 0);
    if (items.length === 0) { showToast("Нет товаров для подарка", false); return; }
    for (const [idStr, qty] of items) {
        const id = parseInt(idStr);
        const card = originalCardsData.find(c => c.id === id);
        if (qty > card.stock) { showToast(`Не хватает "${card.name}" (нужно ${qty}, есть ${card.stock})`, false); return; }
    }
    const historyItems = items.map(([idStr, qty]) => { const id = parseInt(idStr); const card = originalCardsData.find(c => c.id === id); return { id: card.id, name: card.name, qty: qty, price: 0 }; });
    addToHistory(historyItems, 0, 'gift', false);
    const cartCopy = { ...cart };
    closeCartModal();
    cart = {};
    itemDiscounts = {};
    selectedDiscountProducts.clear();
    updateCartUI();
    for (const [idStr, qty] of Object.entries(cartCopy)) {
        if (qty === 0) continue;
        const id = parseInt(idStr);
        const card = originalCardsData.find(c => c.id === id);
        const newStock = card.stock - qty;
        card.stock = newStock;
        const cards = document.querySelectorAll('.card');
        let targetCard = null;
        for (let i = 0; i < cards.length; i++) {
            const idAttr = cards[i].getAttribute('data-id');
            if (idAttr && parseInt(idAttr) === id) { targetCard = cards[i]; break; }
        }
        if (targetCard) {
            const stockSpan = targetCard.querySelector('.stock');
            if (stockSpan) stockSpan.textContent = `Остаток: ${newStock} шт`;
            if (newStock === 0) targetCard.classList.add('out-of-stock');
            else targetCard.classList.remove('out-of-stock');
        }
    }
    (async () => {
        for (const [idStr, qty] of Object.entries(cartCopy)) {
            if (qty === 0) continue;
            const id = parseInt(idStr);
            for (let i = 0; i < qty; i++) {
                if (!isOnline) {
                    addPendingOperation("update", `&id=${id}&delta=-1`);
                } else {
                    try { await fetch(buildApiUrl("update", `&id=${id}&delta=-1`)); } catch(e) { addPendingOperation("update", `&id=${id}&delta=-1`); }
                }
            }
        }
        showUpdateTime();
    })();
    showToast(`Подарок оформлен!`, true);
}

function openCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) { modal.style.display = 'block'; discountPanelOpen = false; }
    updateCartUI();
}

function closeCartModal() { const modal = document.getElementById('cartModal'); if (modal) modal.style.display = 'none'; }

async function updateStock(id, delta, silent = false) {
    const card = originalCardsData.find(c => c.id === id);
    if (!card) return;
    const newStock = card.stock + delta;
    if (newStock < 0) { if (!silent) showToast("Остаток не может быть меньше 0", false); return; }
    card.stock = newStock;
    filterAndSort();
    
    if (!isOnline) {
        addPendingOperation("update", `&id=${id}&delta=${delta}`);
        updateCardBadges();
        if (!silent) {
            if (delta === -1) { addSingleSaleToHistory({ id: card.id, name: card.name, price: card.price }, 1, false); showToast(`Продажа: ${card.name} -1 шт (будет синхронизировано)`, true); }
            else if (delta === 1) { addSingleSaleToHistory({ id: card.id, name: card.name, price: card.price }, 1, true); showToast(`Возврат: ${card.name} +1 шт (будет синхронизировано)`, true); }
        }
        return;
    }
    
    try {
        const response = await fetch(buildApiUrl("update", `&id=${id}&delta=${delta}`));
        const result = await response.json();
        if (!result.success && !silent) { await loadData(true, true); showToast("Ошибка: " + (result.error || "неизвестная"), false); }
    } catch (error) {
        console.error(error);
        addPendingOperation("update", `&id=${id}&delta=${delta}`);
        if (!silent) showToast(`Операция сохранена для синхронизации`, true);
    }
    updateCardBadges();
    if (!silent) {
        if (delta === -1) { addSingleSaleToHistory({ id: card.id, name: card.name, price: card.price }, 1, false); showToast(`Продажа: ${card.name} -1 шт`, true); }
        else if (delta === 1) { addSingleSaleToHistory({ id: card.id, name: card.name, price: card.price }, 1, true); showToast(`Возврат: ${card.name} +1 шт`, true); }
    }
}

async function checkout() {
    const items = Object.entries(cart).filter(([_, qty]) => qty > 0);
    if (items.length === 0) { showToast("Нет товаров для продажи", false); return; }
    let subtotal = 0;
    for (const [idStr, qty] of items) { const id = parseInt(idStr); const card = originalCardsData.find(c => c.id === id); subtotal += qty * card.price; }
    let total = 0;
    for (const [idStr, qty] of items) { const id = parseInt(idStr); const card = originalCardsData.find(c => c.id === id); const best = getBestDiscountForItem(id, card.price, qty, subtotal); total += best.price * qty; }
    for (const [idStr, qty] of items) { const id = parseInt(idStr); const card = originalCardsData.find(c => c.id === id); if (qty > card.stock) { showToast(`Не хватает "${card.name}" (нужно ${qty}, есть ${card.stock})`, false); return; } }
    const activeRules = checkRulesForCart();
    if (activeRules.length > 0) { let rulesMessage = "Не забудьте:\n"; for (const rule of activeRules) rulesMessage += `• ${rule.message}\n`; showToast(rulesMessage, true); }
    const historyItems = items.map(([idStr, qty]) => { const id = parseInt(idStr); const card = originalCardsData.find(c => c.id === id); return { id: card.id, name: card.name, qty: qty, price: card.price }; });
    addToHistory(historyItems, total, 'basket', false);
    const cartCopy = { ...cart };
    closeCartModal();
    cart = {};
    itemDiscounts = {};
    selectedDiscountProducts.clear();
    updateCartUI();
    for (const [idStr, qty] of Object.entries(cartCopy)) {
        if (qty === 0) continue;
        const id = parseInt(idStr);
        const card = originalCardsData.find(c => c.id === id);
        const newStock = card.stock - qty;
        card.stock = newStock;
        const cards = document.querySelectorAll('.card');
        let targetCard = null;
        for (let i = 0; i < cards.length; i++) {
            const idAttr = cards[i].getAttribute('data-id');
            if (idAttr && parseInt(idAttr) === id) { targetCard = cards[i]; break; }
        }
        if (targetCard) {
            const stockSpan = targetCard.querySelector('.stock');
            if (stockSpan) stockSpan.textContent = `Остаток: ${newStock} шт`;
            if (newStock === 0) targetCard.classList.add('out-of-stock');
            else targetCard.classList.remove('out-of-stock');
        }
    }
    (async () => {
        for (const [idStr, qty] of Object.entries(cartCopy)) {
            if (qty === 0) continue;
            const id = parseInt(idStr);
            for (let i = 0; i < qty; i++) {
                if (!isOnline) {
                    addPendingOperation("update", `&id=${id}&delta=-1`);
                } else {
                    try { await fetch(buildApiUrl("update", `&id=${id}&delta=-1`)); } catch(e) { addPendingOperation("update", `&id=${id}&delta=-1`); }
                }
            }
        }
        showUpdateTime();
    })();
    showToast(`Продажа на ${Math.max(0, total).toFixed(2)} ₽ завершена!`, true);
}
