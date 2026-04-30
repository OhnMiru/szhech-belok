// ========== МОДУЛЬ ДЛЯ РАБОТЫ С ФОТО (через прокси) ==========

async function loadPhotoPreview(itemId) {
    const container = document.getElementById('photoPreviewContainer');
    if (!container) return;
    
    try {
        const url = await getPhotoUrl(itemId);
        console.log("Preview URL:", url);
        
        if (url) {
            container.innerHTML = `<img src="${url}?t=${Date.now()}" alt="Фото товара" style="max-width: 100%; max-height: 150px; border-radius: 8px; object-fit: contain; border: 1px solid var(--border-color);"
                onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\"display: flex; align-items: center; justify-content: center; height: 150px; background: var(--badge-bg); border-radius: 8px; color: var(--text-muted);\">❌ Ошибка загрузки фото</div>';">`;
            const deleteBtn = document.getElementById('deletePhotoBtn');
            if (deleteBtn) deleteBtn.style.display = 'inline-flex';
        } else {
            container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 150px; background: var(--badge-bg); border-radius: 8px; color: var(--text-muted);">📷 Нет фото</div>`;
            const deleteBtn = document.getElementById('deletePhotoBtn');
            if (deleteBtn) deleteBtn.style.display = 'none';
        }
    } catch(e) {
        console.error("Error loading photo preview:", e);
        container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 150px; background: var(--badge-bg); border-radius: 8px; color: var(--text-muted);">❌ Ошибка: ${e.message}</div>`;
    }
}

async function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log("Selected file:", file.name, (file.size / 1024).toFixed(2) + "KB");
    
    if (!file.type.startsWith('image/')) {
        showToast("Пожалуйста, выберите изображение", false);
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast("Файл слишком большой. Максимум 5MB", false);
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
        const fileInput = document.getElementById('photoFileInput');
        if (fileInput) fileInput.value = '';
    }
}

async function handleDeletePhoto() {
    if (!currentEditId) {
        showToast("Товар не выбран", false);
        return;
    }
    
    if (confirm("Удалить фото товара?")) {
        showToast("Удаление фото...", true);
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
    
    loadPhotoToModal(itemId);
}

async function loadPhotoToModal(itemId) {
    const content = document.getElementById('photoModalContent');
    if (!content) return;
    
    try {
        const url = await getPhotoUrl(itemId);
        
        if (url) {
            content.innerHTML = `<img src="${url}?t=${Date.now()}" alt="Фото товара" style="max-width: 100%; max-height: 60vh; border-radius: 12px; object-fit: contain;">`;
        } else {
            content.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">📷 Фото не добавлено</div>`;
        }
    } catch(e) {
        console.error("Error loading photo to modal:", e);
        content.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">❌ Ошибка загрузки фото</div>`;
    }
}

function closePhotoModal() {
    const modal = document.getElementById('photoViewModal');
    if (modal) modal.style.display = 'none';
    currentPhotoItemId = null;
    currentPhotoItemName = null;
}

function initPhotoUploadInEditModal() {
    const fileInput = document.getElementById('photoFileInput');
    const deleteBtn = document.getElementById('deletePhotoBtn');
    const uploadBtn = document.getElementById('uploadPhotoBtn');
    
    if (uploadBtn) {
        const newUploadBtn = uploadBtn.cloneNode(true);
        uploadBtn.parentNode.replaceChild(newUploadBtn, uploadBtn);
        
        newUploadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (fileInput) fileInput.click();
        });
    }
    
    if (fileInput) {
        const newFileInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newFileInput, fileInput);
        
        newFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) handlePhotoUpload(e);
        });
    }
    
    if (deleteBtn) {
        const newDeleteBtn = deleteBtn.cloneNode(true);
        deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
        
        newDeleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            handleDeletePhoto();
        });
    }
}
