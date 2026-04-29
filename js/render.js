// ========== РЕНДЕР КАРТОЧЕК ==========
function renderCards() {
    const container = document.getElementById('cards-container');
    if (!container) return;
    container.innerHTML = '';
    if (currentFilteredData.length === 0) {
        container.innerHTML = '<div class="loading">🍌 Ни одного бананчика не найдено 🍌</div>';
        return;
    }
    currentFilteredData.forEach((card, displayIndex) => {
        const id = card.id;
        const type = card.type || "";
        const name = card.name || "Без названия";
        const total = typeof card.total === 'number' ? card.total : 0;
        const stock = typeof card.stock === 'number' ? card.stock : 0;
        const price = typeof card.price === 'number' ? card.price : 0;
        const isOutOfStock = stock === 0;
        const typeColor = type ? getTypeColor(type) : '#c25d1a';
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${isOutOfStock ? 'out-of-stock' : ''}`;
        cardDiv.style.position = 'relative';
        cardDiv.setAttribute('data-id', id);
        cardDiv.setAttribute('draggable', currentSortBy === 'custom');
        cardDiv.setAttribute('data-index', displayIndex);
        if (currentSortBy === 'custom') {
            cardDiv.addEventListener('dragstart', (e) => dragStartHandler(e, displayIndex));
            cardDiv.addEventListener('dragend', dragEndHandler);
            cardDiv.addEventListener('dragover', dragOverHandler);
            cardDiv.addEventListener('dragleave', dragLeaveHandler);
            cardDiv.addEventListener('drop', (e) => dropHandler(e, displayIndex));
        }
        cardDiv.innerHTML = `
            <div class="info">
                <div class="title-row">
                    ${type ? `<span class="type-badge" style="background: ${typeColor}20; color: ${typeColor}; border: 1px solid ${typeColor}40;">${escapeHtml(type)}</span>` : ''}
                    ${currentSortBy === 'custom' ? '<span class="sort-handle">⋮⋮</span>' : ''}
                    <span class="name clickable" data-id="${id}" data-name="${escapeHtml(name)}">${escapeHtml(name)}</span>
                </div>
                <div class="stock-row"><span class="stock">Остаток: ${stock} шт</span></div>
                <div class="total-row"><span class="total">📦 Всего: ${total} шт</span><button class="edit-icon" onclick="openEditProductModal(${id})">✏️</button></div>
                <div class="price-row"><span class="price">💰 Цена: ${price} ₽</span></div>
            </div>
            <div class="buttons">
                <button class="minus" data-id="${id}" data-delta="-1">−1</button>
                <button class="plus" data-id="${id}" data-delta="+1">+1</button>
                <button class="add-to-cart" data-id="${id}">➕</button>
            </div>
        `;
        container.appendChild(cardDiv);
    });
    
    document.querySelectorAll('.minus, .plus').forEach(btn => {
        btn.removeEventListener('click', handleButtonClick);
        btn.addEventListener('click', handleButtonClick);
    });
    
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.removeEventListener('click', handleAddToCart);
        btn.addEventListener('click', handleAddToCart);
    });
    
    // Добавляем обработчики клика по названию товара для открытия фото
    document.querySelectorAll('.name.clickable').forEach(nameEl => {
        nameEl.removeEventListener('click', handleNameClick);
        nameEl.addEventListener('click', handleNameClick);
    });
    
    updateCardBadges();
}

function handleNameClick(e) {
    e.stopPropagation();
    const id = parseInt(e.currentTarget.dataset.id);
    const name = e.currentTarget.dataset.name;
    console.log("Opening photo modal for:", name, "id:", id);
    openPhotoModal(id, name);
}

function handleAddToCart(e) {
    const btn = e.currentTarget;
    const id = parseInt(btn.dataset.id);
    addToCart(id);
}

async function handleButtonClick(e) {
    const btn = e.currentTarget;
    const id = parseInt(btn.dataset.id);
    const delta = parseInt(btn.dataset.delta);
    await updateStock(id, delta);
}
