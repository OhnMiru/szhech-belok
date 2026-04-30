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
        
        // Проверяем, есть ли комментарий
        const hasComment = commentsCache.has(id) && commentsCache.get(id).comment && commentsCache.get(id).comment.trim() !== "";
        
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
                <div class="total-row">
                    <span class="total">📦 Всего: ${total} шт</span>
                    <button class="edit-icon" onclick="openEditProductModal(${id})">✏️</button>
                </div>
                <div class="comment-row">
                    <button class="comment-icon ${hasComment ? 'has-comment' : ''}" onclick="showCommentModal(${id}, '${escapeHtml(name).replace(/'/g, "\\'")}')" title="Комментарий">
                        💬 Комментарий
                        ${hasComment ? '<span class="comment-badge"></span>' : ''}
                    </button>
                </div>
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

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С МОДАЛЬНЫМ ОКНОМ КОММЕНТАРИЯ ==========

async function openCommentModal(itemId, itemName) {
    // Получаем текущий комментарий
    let currentComment = "";
    if (commentsCache.has(itemId) && commentsCache.get(itemId).comment) {
        currentComment = commentsCache.get(itemId).comment;
    } else if (isOnline) {
        // Пробуем загрузить с сервера, если нет в кэше
        const commentData = await getComment(itemId);
        if (commentData && commentData.comment) {
            currentComment = commentData.comment;
        }
    }
    
    // Создаём или получаем модальное окно для комментария
    let modal = document.getElementById('commentModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'commentModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <button class="modal-close-btn" onclick="closeCommentModal()">×</button>
                <div class="modal-header">
                    <span>💬 Комментарий к товару</span>
                </div>
                <div id="commentModalContent">
                    <div class="comment-item-name" id="commentItemName" style="margin-bottom: 12px; font-weight: bold; color: var(--badge-text);"></div>
                    <textarea id="commentText" rows="5" style="width: 100%; padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-primary); font-size: 14px; resize: vertical;" placeholder="Введите комментарий к товару..."></textarea>
                    <div class="comment-last-updated" id="commentLastUpdated" style="font-size: 11px; color: var(--text-muted); margin-top: 8px;"></div>
                    <div class="edit-buttons" style="margin-top: 16px; display: flex; gap: 12px; justify-content: flex-end;">
                        <button class="edit-cancel-btn" onclick="closeCommentModal()">❌ Отмена</button>
                        <button class="edit-save-btn" onclick="saveCommentAndClose()">💾 Сохранить</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Заполняем данные
    document.getElementById('commentItemName').innerHTML = `📦 ${escapeHtml(itemName)} (ID: ${itemId})`;
    document.getElementById('commentText').value = currentComment;
    
    const lastUpdated = commentsCache.has(itemId) && commentsCache.get(itemId).lastUpdated 
        ? new Date(commentsCache.get(itemId).lastUpdated).toLocaleString('ru-RU')
        : null;
    const lastUpdatedEl = document.getElementById('commentLastUpdated');
    if (lastUpdatedEl) {
        lastUpdatedEl.innerHTML = lastUpdated ? `Последнее изменение: ${lastUpdated}` : '';
    }
    
    // Сохраняем itemId в атрибут модального окна
    modal.setAttribute('data-item-id', itemId);
    modal.setAttribute('data-item-name', itemName);
    
    modal.style.display = 'block';
}

function closeCommentModal() {
    const modal = document.getElementById('commentModal');
    if (modal) modal.style.display = 'none';
}

async function saveCommentAndClose() {
    const modal = document.getElementById('commentModal');
    if (!modal) return;
    
    const itemId = parseInt(modal.getAttribute('data-item-id'));
    const commentText = document.getElementById('commentText').value;
    
    if (isNaN(itemId)) return;
    
    // Сохраняем комментарий
    const success = await saveComment(itemId, commentText);
    
    if (success) {
        // Обновляем индикатор в карточке
        updateCommentIndicators();
        closeCommentModal();
    }
}

// Функция для обновления индикатора комментария на карточке
function updateCommentIndicators() {
    document.querySelectorAll('.card').forEach(card => {
        const itemId = parseInt(card.getAttribute('data-id'));
        const hasComment = commentsCache.has(itemId) && commentsCache.get(itemId).comment && commentsCache.get(itemId).comment.trim() !== "";
        
        const commentBtn = card.querySelector('.comment-icon');
        if (commentBtn) {
            if (hasComment) {
                commentBtn.classList.add('has-comment');
                let badge = commentBtn.querySelector('.comment-badge');
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'comment-badge';
                    commentBtn.appendChild(badge);
                }
            } else {
                commentBtn.classList.remove('has-comment');
                const badge = commentBtn.querySelector('.comment-badge');
                if (badge) badge.remove();
            }
        }
    });
}
