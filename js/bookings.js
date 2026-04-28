function renderBookingsList() {
    const container = document.getElementById('bookings-content');
    if (!container) return;
    
    const activeBookings = bookings.filter(b => b.status === "active");
    
    let html = '';
    
    // Список ников (если есть активные бронирования)
    if (activeBookings.length > 0) {
        html += `<div class="bookings-nicknames" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);">
                    <div style="width: 100%; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">👤 Ники с активными бронями:</div>`;
        for (const booking of activeBookings) {
            html += `<button class="booking-nickname-btn" onclick="viewBookingDetails(${booking.id})" style="background: ${currentViewingBookingId === booking.id ? 'var(--btn-bg)' : 'var(--badge-bg)'}; border: 1px solid var(--border-color); border-radius: 30px; padding: 6px 14px; font-size: 13px; cursor: pointer; color: ${currentViewingBookingId === booking.id ? 'white' : 'var(--text-primary)'};">${escapeHtml(booking.nickname)}</button>`;
        }
        html += `</div>`;
    }
    
    // Форма добавления нового бронирования (всегда видна)
    html += `<div class="add-booking-form" style="margin-bottom: 20px; padding: 16px; background: var(--badge-bg); border-radius: 16px;">
        <div style="font-weight: bold; margin-bottom: 12px;">➕ Новое бронирование</div>
        <div class="edit-row" style="margin-bottom: 12px;">
            <span class="edit-label">Ник покупателя</span>
            <input type="text" id="bookingNickname" class="edit-input" placeholder="Введите ник" style="flex: 2;">
        </div>
        <div class="edit-row" style="margin-bottom: 12px; flex-wrap: wrap;">
            <span class="edit-label" style="min-width: 80px;">Товары</span>
            <div style="flex: 2;">
                <div class="discount-custom-select">
                    <div class="discount-custom-select-trigger" id="bookingProductSelectTrigger" onclick="toggleBookingProductSelect()" style="background: var(--card-bg);">📦 Выберите товары</div>
                    <div class="discount-custom-select-dropdown" id="bookingProductSelectDropdown" style="max-height: 250px; overflow-y: auto; width: 100%; min-width: 280px;"></div>
                </div>
            </div>
        </div>
        <div id="selectedBookingProductsList" style="margin-bottom: 12px; padding: 8px; background: var(--card-bg); border-radius: 12px;"></div>
        <button class="edit-save-btn" onclick="createBooking()" style="width: auto; padding: 8px 24px; background: var(--btn-bg); color: white; border: none; border-radius: 30px; cursor: pointer;">📦 Забронировать</button>
    </div>`;
    
    // Детали выбранного бронирования (если есть)
    if (currentViewingBookingId) {
        const booking = bookings.find(b => b.id == currentViewingBookingId);
        if (booking && booking.status === "active") {
            const date = new Date(booking.date);
            const dateStr = date.toLocaleString('ru-RU');
            let total = 0;
            for (const item of booking.items) {
                total += item.price * item.qty;
            }
            
            html += `<div class="booking-details" style="margin-top: 20px;">
                <div class="detail-title">📋 Бронирование: ${escapeHtml(booking.nickname)} (${dateStr})</div>
                <div class="table-wrapper">
                    <table class="detail-table-small" style="width: 100%;">
                        <thead>
                            <tr><th>Товар</th><th>Тип</th><th class="text-right">Кол-во</th><th class="text-right">Цена</th><th class="text-right">Сумма</th>
                        </thead>
                        <tbody>`;
            for (const item of booking.items) {
                const sum = item.price * item.qty;
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
                <div class="edit-buttons" style="margin-top: 16px; display: flex; justify-content: flex-end; gap: 12px;">
                    <button class="edit-cancel-btn" onclick="cancelBooking(${booking.id})" style="background: var(--minus-bg); color: var(--minus-color); border: 1px solid var(--border-color); border-radius: 30px; padding: 8px 16px; cursor: pointer;">❌ Отменить бронь</button>
                    <button class="edit-save-btn" onclick="moveBookingToCart(${booking.id})" style="background: var(--btn-bg); color: white; border: none; border-radius: 30px; padding: 8px 16px; cursor: pointer;">🛒 В корзину</button>
                </div>
            </div>`;
        } else {
            currentViewingBookingId = null;
        }
    } else if (activeBookings.length > 0) {
        // Если есть активные бронирования, но не выбран конкретный, показываем первый
        currentViewingBookingId = activeBookings[0].id;
        const booking = activeBookings[0];
        const date = new Date(booking.date);
        const dateStr = date.toLocaleString('ru-RU');
        let total = 0;
        for (const item of booking.items) {
            total += item.price * item.qty;
        }
        
        html += `<div class="booking-details" style="margin-top: 20px;">
            <div class="detail-title">📋 Бронирование: ${escapeHtml(booking.nickname)} (${dateStr})</div>
            <div class="table-wrapper">
                <table class="detail-table-small" style="width: 100%;">
                    <thead>
                        <tr><th>Товар</th><th>Тип</th><th class="text-right">Кол-во</th><th class="text-right">Цена</th><th class="text-right">Сумма</th>
                    </thead>
                    <tbody>`;
        for (const item of booking.items) {
            const sum = item.price * item.qty;
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
            <div class="edit-buttons" style="margin-top: 16px; display: flex; justify-content: flex-end; gap: 12px;">
                <button class="edit-cancel-btn" onclick="cancelBooking(${booking.id})" style="background: var(--minus-bg); color: var(--minus-color); border: 1px solid var(--border-color); border-radius: 30px; padding: 8px 16px; cursor: pointer;">❌ Отменить бронь</button>
                <button class="edit-save-btn" onclick="moveBookingToCart(${booking.id})" style="background: var(--btn-bg); color: white; border: none; border-radius: 30px; padding: 8px 16px; cursor: pointer;">🛒 В корзину</button>
            </div>
        </div>`;
    }
    
    if (activeBookings.length === 0 && !currentViewingBookingId) {
        html += `<div class="empty-cart" style="margin-top: 20px;">📭 Нет активных бронирований. Создайте новое!</div>`;
    }
    
    container.innerHTML = html;
    
    // Заполняем селектор товаров
    renderBookingProductSelect();

// Делаем функции глобальными
window.loadBookings = loadBookings;
window.renderBookingsList = renderBookingsList;
window.openBookingsModal = openBookingsModal;
window.closeBookingsModal = closeBookingsModal;
window.createBooking = createBooking;
window.cancelBooking = cancelBooking;
window.moveBookingToCart = moveBookingToCart;
window.viewBookingDetails = viewBookingDetails;
window.toggleBookingProductSelect = toggleBookingProductSelect;
window.toggleBookingProduct = toggleBookingProduct;
window.changeBookingProductQty = changeBookingProductQty;
    renderSelectedBookingProducts();
}
