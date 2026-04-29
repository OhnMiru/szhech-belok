// ========== МОДУЛЬ ДЛЯ РАБОТЫ С ФОТО ==========

async function loadPhotoPreview(itemId) {
    const container = document.getElementById('photoPreviewContainer');
    if (!container) return;
    
    const url = await getPhotoUrl(itemId);
    
    if (url) {
        container.innerHTML = `<img src="${url}" alt="Фото товара" style="max-width: 100%; max-height: 150px; border-radius: 8px;">`;
        const deleteBtn = document.getElementById('deletePhotoBtn');
        if (deleteBtn) deleteBtn.style.display = 'inline-flex';
    } else {
        container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 150px; background: var(--badge-bg); border-radius: 8px; color: var(--text-muted);">📷 Нет фото</div>`;
        const deleteBtn = document.getElementById('deletePhotoBtn');
        if (deleteBtn) deleteBtn.style.display = 'none';
    }
}

async function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
        showToast("Пожалуйста, выберите изображение", false);
        return;
    }
    
    // Проверяем размер (максимум 5 МБ)
    if (file.size > 5 * 1024 * 1024) {
        showToast("Файл слишком большой. Максимум 5 МБ", false);
        return;
    }
    
    if (!currentEditId) {
        showToast("Товар не выбран", false);
        return;
    }
    
    showToast("Загрузка фото...", true);
    const success = await uploadPhoto(currentEditId, file);
    
    if (success) {
        await loadPhotoPreview(currentEditId);
        // Очищаем input, чтобы можно было загрузить тот же файл снова
        document.getElementById('photoFileInput').value = '';
    }
}

async function handleDeletePhoto() {
    if (!currentEditId) {
        showToast("Товар не выбран", false);
        return;
    }
    
    if (confirm("Удалить фото товара?")) {
        const success = await deletePhoto(currentEditId);
        if (success) {
            await loadPhotoPreview(currentEditId);
        }
    }
}

function openPhotoModal(itemId, itemName) {
    currentPhotoItemId = itemId;
    currentPhotoItemName = itemName;
    
    const modal = document.getElementById('photoViewModal');
    const title = document.getElementById('photoModalTitle');
    const content = document.getElementById('photoModalContent');
    
    if (title) title.textContent = `📷 ${escapeHtml(itemName)}`;
    
    if (content) {
        content.innerHTML = '<div class="loading">Загрузка фото...</div>';
    }
    
    if (modal) modal.style.display = 'block';
    
    // Загружаем фото
    loadPhotoToModal(itemId);
}

async function loadPhotoToModal(itemId) {
    const content = document.getElementById('photoModalContent');
    if (!content) return;
    
    const url = await getPhotoUrl(itemId);
    
    if (url) {
        content.innerHTML = `<img src="${url}" alt="Фото товара" style="max-width: 100%; max-height: 60vh; border-radius: 12px;">`;
    } else {
        content.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">📷 Фото не добавлено</div>`;
    }
}

function closePhotoModal() {
    const modal = document.getElementById('photoViewModal');
    if (modal) modal.style.display = 'none';
    currentPhotoItemId = null;
    currentPhotoItemName = null;
}

// Инициализация элементов для фото в модалке редактирования
function initPhotoUploadInEditModal() {
    const fileInput = document.getElementById('photoFileInput');
    const deleteBtn = document.getElementById('deletePhotoBtn');
    const uploadBtn = document.getElementById('uploadPhotoBtn');
    
    if (fileInput) {
        fileInput.removeEventListener('change', handlePhotoUpload);
        fileInput.addEventListener('change', handlePhotoUpload);
    }
    
    if (deleteBtn) {
        deleteBtn.removeEventListener('click', handleDeletePhoto);
        deleteBtn.addEventListener('click', handleDeletePhoto);
    }
    
    if (uploadBtn) {
        uploadBtn.removeEventListener('click', () => {});
        uploadBtn.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });
    }
}
