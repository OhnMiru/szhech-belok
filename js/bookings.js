// ========== БРОНИРОВАНИЯ ==========
let bookings = [];
let currentBookingProducts = new Map(); // id -> { qty, price, cost, name, type }

function saveBookingsToLocal() {
    localStorage.setItem('merch_bookings', JSON.stringify(bookings));
}

function loadBookingsFromLocal() {
    const saved = localStorage.getItem('merch_bookings');
    if (saved) {
        try {
            bookings = JSON.parse(saved);
        } catch(e) {
            bookings = [];
        }
    } else {
        bookings = [];
    }
}

async function syncFullBookingsToServer() {
    if (!isOnline) {
        addPendingOperation("syncFullBookings", `&data=${encodeURIComponent(JSON.stringify(bookings))}`);
        return;
    }
    try {
        const data = encodeURIComponent(JSON.stringify(bookings));
        await fetch(buildApiUrl("syncFullBookings", `&data=${data}`));
    } catch(e) {
        console.error(e);
        addPendingOperation("syncFullBookings", `&data=${encodeURIComponent(JSON.stringify(bookings))}`);
    }
}

async function loadBookingsFromServer() {
    if (!isOnline) {
        loadBookingsFromLocal();
        return false;
    }
    try {
        const response = await fetch(buildApiUrl("getFullBookings"));
        const data = await response.json();
        if (data && data.bookings) {
            bookings = data.bookings;
            saveBookingsToLocal();
            return true;
        }
        return false;
    } catch(e) {
        return false;
    }
}

async function loadBookings() {
    const loaded = await loadBookingsFromServer();
    if (!loaded) loadBookingsFromLocal();
}

function saveBookings() {
    saveBookingsToLocal();
    syncFullBookingsToServer();
}

function addBooking(nickname, items) {
    const booking = {
        id: Date.now() + Math.random(),
        nickname: nickname.trim(),
        date: new Date().toISOString(),
        items: items.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            qty: item.qty,
            price: item.price,
            cost: item.cost || 0
        })),
        status: "active"
    };
    
    // Списываем товары со склада
    for (const item of items) {
        const card = originalCardsData.find(c => c.id === item.id);
        if (card) {
            const newStock = card.stock - item.qty;
            if (newStock < 0) {
                showToast(`Недостаточно товара "${card.name}" для бронирования`, false);
                return false;
            }
            card.stock = newStock;
            
            // Обновляем DOM
            const cardElement = document.querySelector(`.card[data-id="${item.id}"]`);
            if (cardElement) {
                const stockSpan = cardElement.querySelector('.stock');
                if (stockSpan) stockSpan.textContent = `Остаток: ${newStock} шт`;
                if (newStock === 0) cardElement.classList.add('out-of-stock');
                else cardElement.classList.remove('out-of-stock');
            }
            
            // Отправляем обновление на сервер
            if (isOnline) {
                fetch(buildApiUrl("update", `&id=${item.id}&delta=-${item.qty}`)).catch(e => {
                    addPendingOperation("update", `&id=${item.id}&delta=-${item.qty}`);
                });
            } else {
                addPendingOperation("update", `&id=${item.id}&delta=-${item.qty}`);
            }
        }
    }
    
    bookings.unshift(booking);
    if (bookings.length > 100) bookings = bookings.slice(0, 100);
    saveBookings();
    renderBookingsList();
    showToast(`Бронирование для "${nickname}" создано`, true);
    return true;
}

async function cancelBooking(bookingId) {
    const booking = bookings.find(b => b.id == bookingId);
    if (!booking) return;
    
    if (!isOnline) {
        addPendingOperation("cancelBooking", `&id=${bookingId}`);
        showToast("Отмена бронирования будет выполнена при восстановлении соединения", true);
        booking.status = "cancelled";
        saveBookings();
        renderBookingsList();
        return;
    }
    
    try {
        const response = await fetch(buildApiUrl("cancelBooking", `&id=${bookingId}`));
        const result = await response.json();
        if (result.success) {
            booking.status = "cancelled";
            saveBookings();
            
            // Восстанавливаем остатки локально
            for (const item of booking.items) {
                const card = originalCardsData.find(c => c.id === item.id);
                if (card) {
                    card.stock += item.qty;
                    const cardElement = document.querySelector(`.card[data-id="${item.id}"]`);
                    if (cardElement) {
                        const stockSpan = cardElement.querySelector('.stock');
                        if (stockSpan) stockSpan.textContent = `Остаток: ${card.stock} шт`;
                        if (card.stock === 0) cardElement.classList.add('out-of-stock');
                        else cardElement.classList.remove('out-of-stock');
                    }
                }
            }
            renderBookingsList();
            showToast("Бронирование отменено, товары возвращены на склад", true);
        } else {
            showToast("Ошибка отмены: " + (result.error || "неизвестная"), false);
        }
    } catch(e) {
        addPendingOperation("cancelBooking", `&id=${bookingId}`);
        showToast("Отмена бронирования будет выполнена при восстановлении соединения", true);
    }
}

function moveBookingToCart(bookingId) {
    const booking = bookings.find(b => b.id == bookingId);
    if (!booking) return;
    
    for (const item of booking.items) {
        const currentQty = cart[item.id] || 0;
        cart[item.id] = currentQty + item.qty;
    }
    
    cancelBooking(bookingId);
    updateCartUI();
    closeBookingsModal();
    openCartModal();
    showToast("Товары из бронирования добавлены в корзину", true);
}

function renderBookingsList() {
    const container = document.getElementById('bookings-content');
    if (!container) return;
    
    if (bookings.length === 0) {
        container.innerHTML = '<div class="empty-cart">📭 Нет активных бронирований</div>';
        return;
    }
    
    const activeBookings = bookings.filter(b => b.status === "active");
    if (activeBookings.length === 0) {
        container.innerHTML = '<div class="empty-cart">📭 Нет активных бронирований</div>';
        return;
    }
    
    let html = `<div class="bookings-nicknames" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);">`;
    for (const booking of activeBookings) {
        html += `<button class="booking-nickname-btn" onclick="viewBookingDetails(${booking.id})" style="background: var(--badge-bg); border: 1px solid var(--border-color); border-radius: 30px; padding: 6px 14px; font-size: 13px; cursor: pointer; color: var(--text-primary);">${escapeHtml(booking.nickname)}</button>`;
    }
    html += `</div>`;
    
    // Форма добавления нового бронирования
    html += `<div class="add-booking-form" style="margin-bottom: 20px; padding: 16px; background: var(--badge-bg); border-radius: 16px;">
        <div style="font-weight: bold; margin-bottom: 12px;">➕ Новое бронирование</div>
        <div class="edit-row" style="margin-bottom: 12px;">
            <span class="edit-label">Ник покупателя</span>
            <input type="text" id="bookingNickname" class="edit-input" placeholder="Введите ник" style="flex: 2;">
        </div>
        <div class="edit-row" style="margin-bottom: 12px;">
            <span class="edit-label">Товары</span>
            <div class="discount-custom-select" style="min-width: 150px;">
                <div class="discount-custom-select-trigger" id="bookingProductSelectTrigger" onclick="toggleBookingProductSelect()">Выберите товары</div>
                <div class="discount-custom-select-dropdown" id="bookingProductSelectDropdown" style="max-height: 200px; overflow-y: auto;"></div>
            </div>
        </div>
        <div id="selectedBookingProductsList" style="margin-bottom: 12px;"></div>
        <button class="edit-save-btn" onclick="createBooking()" style="width: auto; padding: 8px 24px;">📦 Забронировать</button>
    </div>`;
    
    // Детали выбранного бронирования
    if (currentViewingBookingId) {
        const booking = bookings.find(b => b.id == currentViewingBookingId);
        if (booking && booking.status === "active") {
            const date = new Date(booking.date);
            const dateStr = date.toLocaleString('ru-RU');
            html += `<div class="booking-details" style="margin-top: 20px;">
                <div class="detail-title">📋 Бронирование: ${escapeHtml(booking.nickname)} (${dateStr})</div>
                <div class="table-wrapper">
                    <table class="detail-table-small">
                        <thead>
                            <tr><th>Товар</th><th>Тип</th><th class="text-right">Кол-во</th><th class="text-right">Цена</th><th class="text-right">Сумма</th>
                        </thead>
                        <tbody>`;
            let total = 0;
            for (const item of booking.items) {
                const sum = item.price * item.qty;
                total += sum;
                html += `<tr>
                            <td>${escapeHtml(item.name)}</td>
                            <td><span class="type-badge" style="background:${getTypeColor(item.type)}20; color:${getTypeColor(item.type)};">${escapeHtml(item.type)}</span></td>
                            <td class="text-right">${item.qty} шт</td>
                            <td class="text-right">${item.price} ₽</td>
                            <td class="text-right">${sum} ₽</td>
                        </tr>`;
            }
            html += `<tr style="border-top: 2px solid var(--border-color); font-weight: bold;">
                        <td colspan="4" class="text-right">Итого:</td>
                        <td class="text-right">${total} ₽</td>
                     </tr>`;
            html += `</tbody>
                    </table>
                </div>
                <div class="edit-buttons" style="margin-top: 16px; justify-content: flex-end;">
                    <button class="edit-cancel-btn" onclick="cancelBooking(${booking.id})">❌ Отменить бронь</button>
                    <button class="edit-save-btn" onclick="moveBookingToCart(${booking.id})">🛒 В корзину</button>
                </div>
            </div>`;
        }
    }
    
    container.innerHTML = html;
    
    // Заполняем селектор товаров
    renderBookingProductSelect();
}

function renderBookingProductSelect() {
    const container = document.getElementById('bookingProductSelectDropdown');
    if (!container) return;
    
    let html = '';
    originalCardsData.forEach(card => {
        if (card.stock > 0) {
            const displayName = `${card.type} ${card.name}`;
            const qtyInCart = currentBookingProducts.get(card.id)?.qty || 0;
            html += `<div class="product-select-item" onclick="toggleBookingProduct(${card.id}, '${escapeHtml(card.name)}', '${escapeHtml(card.type)}', ${card.price}, ${card.cost || 0})">
                        <div style="flex: 1;">
                            <div>${escapeHtml(displayName)}</div>
                            <div style="font-size: 11px; color: var(--text-muted);">В наличии: ${card.stock} шт, цена: ${card.price} ₽</div>
                        </div>
                        ${qtyInCart > 0 ? `<div style="display: flex; align-items: center; gap: 8px;">
                            <button class="cart-qty-btn" onclick="event.stopPropagation(); changeBookingProductQty(${card.id}, -1)">−</button>
                            <span style="min-width: 30px; text-align: center;">${qtyInCart}</span>
                            <button class="cart-qty-btn" onclick="event.stopPropagation(); changeBookingProductQty(${card.id}, 1)">+</button>
                        </div>` : '<span style="color: var(--text-muted);">➕ Выбрать</span>'}
                    </div>`;
        }
    });
    container.innerHTML = html || '<div class="product-select-item">Нет доступных товаров</div>';
}

function toggleBookingProductSelect() {
    const dropdown = document.getElementById('bookingProductSelectDropdown');
    if (dropdown) dropdown.classList.toggle('show');
}

function toggleBookingProduct(id, name, type, price, cost) {
    if (currentBookingProducts.has(id)) {
        currentBookingProducts.delete(id);
    } else {
        const card = originalCardsData.find(c => c.id === id);
        if (card && card.stock > 0) {
            currentBookingProducts.set(id, { qty: 1, name: name, type: type, price: price, cost: cost });
        } else {
            showToast("Товар временно недоступен", false);
            return;
        }
    }
    renderBookingProductSelect();
    renderSelectedBookingProducts();
}

function changeBookingProductQty(id, delta) {
    const product = currentBookingProducts.get(id);
    if (!product) return;
    const card = originalCardsData.find(c => c.id === id);
    const newQty = product.qty + delta;
    if (newQty < 1) {
        currentBookingProducts.delete(id);
    } else if (card && newQty <= card.stock) {
        product.qty = newQty;
        currentBookingProducts.set(id, product);
    } else {
        showToast(`Нельзя забронировать больше, чем есть (${card.stock} шт)`, false);
        return;
    }
    renderBookingProductSelect();
    renderSelectedBookingProducts();
}

function renderSelectedBookingProducts() {
    const container = document.getElementById('selectedBookingProductsList');
    if (!container) return;
    
    if (currentBookingProducts.size === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Товары не выбраны</div>';
        return;
    }
    
    let html = '<div style="font-size: 13px; font-weight: bold; margin-bottom: 8px;">Выбранные товары:</div>';
    for (const [id, product] of currentBookingProducts) {
        const displayName = `${product.type} ${product.name}`;
        html += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border-color);">
                    <span>${escapeHtml(displayName)}</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button class="cart-qty-btn" onclick="changeBookingProductQty(${id}, -1)" style="width: 28px; height: 28px;">−</button>
                        <span style="min-width: 30px; text-align: center;">${product.qty}</span>
                        <button class="cart-qty-btn" onclick="changeBookingProductQty(${id}, 1)" style="width: 28px; height: 28px;">+</button>
                        <button class="cart-item-remove" onclick="toggleBookingProduct(${id})" style="width: 28px; height: 28px;">🗑</button>
                    </div>
                </div>`;
    }
    container.innerHTML = html;
}

function createBooking() {
    const nicknameInput = document.getElementById('bookingNickname');
    const nickname = nicknameInput?.value.trim();
    
    if (!nickname) {
        showToast("Введите ник покупателя", false);
        return;
    }
    
    if (currentBookingProducts.size === 0) {
        showToast("Выберите хотя бы один товар", false);
        return;
    }
    
    const items = [];
    for (const [id, product] of currentBookingProducts) {
        const card = originalCardsData.find(c => c.id === id);
        if (card && product.qty <= card.stock) {
            items.push({
                id: id,
                name: product.name,
                type: product.type,
                qty: product.qty,
                price: product.price,
                cost: product.cost
            });
        } else {
            showToast(`Недостаточно товара "${product.name}"`, false);
            return;
        }
    }
    
    if (addBooking(nickname, items)) {
        nicknameInput.value = '';
        currentBookingProducts.clear();
        renderSelectedBookingProducts();
        renderBookingProductSelect();
        
        // Показываем созданное бронирование
        const newBooking = bookings.find(b => b.nickname === nickname && b.status === "active");
        if (newBooking) {
            currentViewingBookingId = newBooking.id;
        }
        renderBookingsList();
    }
}

function viewBookingDetails(bookingId) {
    currentViewingBookingId = bookingId;
    renderBookingsList();
}

// Инициализация селектора товаров при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Закрываем дропдаун при клике вне
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('bookingProductSelectDropdown');
        const trigger = document.getElementById('bookingProductSelectTrigger');
        if (dropdown && trigger && !trigger.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
});
