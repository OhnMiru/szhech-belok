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
        
        const attribute1 = card.attribute1 || "";
        const attribute2 = card.attribute2 || "";
        
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
        
        // Формируем текст для плашки: тип + атрибуты через |
        let typeDisplayText = type;
        if (attribute1) typeDisplayText += ` | ${attribute1}`;
        if (attribute2) typeDisplayText += ` | ${attribute2}`;
        
        // Формируем блок кнопок для первой строки
        const actionButtonsHtml = `
            <div class="action-buttons-inline" style="display: inline-flex; gap: 6px; margin-left: 8px;">
                <button class="edit-icon" onclick="openEditProductModal(${id})" title="Редактировать" style="background: none; border: none; cursor: pointer; font-size: 14px; padding: 2px;">✏️</button>
                <button class="comment-icon ${hasComment ? 'has-comment' : ''}" onclick="showCommentModal(${id}, '${escapeHtml(name).replace(/'/g, "\\'")}')" title="Комментарий" style="background: none; border: none; cursor: pointer; font-size: 14px; padding: 2px; position: relative;">
                    💬
                    ${hasComment ? '<span class="comment-badge" style="position: absolute; top: -4px; right: -6px; width: 8px; height: 8px; background: #f39c12; border-radius: 50%;"></span>' : ''}
                </button>
            </div>
        `;
        
        // Ручка для сортировки
        const sortHandleHtml = currentSortBy === 'custom' ? '<span class="sort-handle" style="cursor: grab; margin-left: 8px; opacity: 0.6;">⋮⋮</span>' : '';
        
        cardDiv.innerHTML = `
            <div class="info">
                <div class="title-row" style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 4px;">
                    ${type ? `<span class="type-badge" style="background: ${typeColor}20; color: ${typeColor}; border: 1px solid ${typeColor}40; padding: 2px 8px; border-radius: 20px; font-size: 11px; display: inline-block;">${escapeHtml(typeDisplayText)}</span>` : ''}
                    ${actionButtonsHtml}
                    ${sortHandleHtml}
                </div>
                <div class="name-row" style="margin-bottom: 6px;">
                    <span class="name clickable" data-id="${id}" data-name="${escapeHtml(name)}" style="font-weight: bold; font-size: 18px; cursor: pointer;">${escapeHtml(name)}</span>
                </div>
                <div class="stock-row"><span class="stock">Остаток: ${stock} шт</span></div>
                <div class="total-row"><span class="total">📦 Всего: ${total} шт</span></div>
                <div class="price-actions-row" style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                    <span class="price">💰 Цена: ${price} ₽</span>
                </div>
            </div>
            <div class="buttons" style="display: flex; gap: 8px; margin-top: 10px;">
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

// ОБНОВЛЕНА: обновление карточки после редактирования (с учётом атрибутов)
function updateCardInDOM(cardId, updatedData) {
    const cardElement = document.querySelector(`.card[data-id="${cardId}"]`);
    if (!cardElement) return;
    
    // Обновляем плашку с типом и атрибутами
    const typeBadge = cardElement.querySelector('.type-badge');
    if (typeBadge && updatedData.type !== undefined) {
        let typeDisplayText = updatedData.type;
        const attr1 = updatedData.attribute1 || "";
        const attr2 = updatedData.attribute2 || "";
        if (attr1) typeDisplayText += ` | ${attr1}`;
        if (attr2) typeDisplayText += ` | ${attr2}`;
        typeBadge.textContent = typeDisplayText;
        
        const typeColor = updatedData.type ? getTypeColor(updatedData.type) : '#c25d1a';
        typeBadge.style.background = `${typeColor}20`;
        typeBadge.style.color = typeColor;
    }
    
    // Обновляем название
    const nameElement = cardElement.querySelector('.name');
    if (nameElement && updatedData.name !== undefined) {
        nameElement.textContent = updatedData.name;
        nameElement.setAttribute('data-name', updatedData.name);
    }
    
    // Обновляем индикатор комментария
    const hasComment = commentsCache.has(cardId) && commentsCache.get(cardId).comment && commentsCache.get(cardId).comment.trim() !== "";
    const commentBtn = cardElement.querySelector('.comment-icon');
    if (commentBtn) {
        if (hasComment) {
            commentBtn.classList.add('has-comment');
            let badge = commentBtn.querySelector('.comment-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'comment-badge';
                badge.style.position = 'absolute';
                badge.style.top = '-4px';
                badge.style.right = '-6px';
                badge.style.width = '8px';
                badge.style.height = '8px';
                badge.style.background = '#f39c12';
                badge.style.borderRadius = '50%';
                commentBtn.appendChild(badge);
            }
        } else {
            commentBtn.classList.remove('has-comment');
            const badge = commentBtn.querySelector('.comment-badge');
            if (badge) badge.remove();
        }
    }
    
    // Обновляем остаток
    const stockSpan = cardElement.querySelector('.stock');
    if (stockSpan && updatedData.stock !== undefined) {
        stockSpan.textContent = `Остаток: ${updatedData.stock} шт`;
        if (updatedData.stock === 0) {
            cardElement.classList.add('out-of-stock');
        } else {
            cardElement.classList.remove('out-of-stock');
        }
    }
    
    // Обновляем общее количество
    const totalSpan = cardElement.querySelector('.total');
    if (totalSpan && updatedData.total !== undefined) {
        totalSpan.textContent = `📦 Всего: ${updatedData.total} шт`;
    }
    
    // Обновляем цену
    const priceSpan = cardElement.querySelector('.price');
    if (priceSpan && updatedData.price !== undefined) {
        priceSpan.textContent = `💰 Цена: ${updatedData.price} ₽`;
    }
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С КОММЕНТАРИЯМИ ==========

async function showCommentModal(itemId, itemName) {
    // Получаем текущий комментарий
    let currentComment = "";
    if (commentsCache.has(itemId) && commentsCache.get(itemId).comment) {
        currentComment = commentsCache.get(itemId).comment;
    } else if (isOnline) {
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
                    <div class="edit-buttons" style="margin-top: 20px; display: flex; gap: 12px; justify-content: flex-end;">
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
    
    const success = await saveComment(itemId, commentText);
    
    if (success) {
        updateCommentIndicators();
        closeCommentModal();
    }
}

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
                    badge.style.position = 'absolute';
                    badge.style.top = '-4px';
                    badge.style.right = '-6px';
                    badge.style.width = '8px';
                    badge.style.height = '8px';
                    badge.style.background = '#f39c12';
                    badge.style.borderRadius = '50%';
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

// Экспортируем функции в глобальную область
window.showCommentModal = showCommentModal;
window.closeCommentModal = closeCommentModal;
window.saveCommentAndClose = saveCommentAndClose;
window.updateCommentIndicators = updateCommentIndicators;
window.updateCardInDOM = updateCardInDOM;
