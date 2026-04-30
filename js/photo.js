// ========== МОДУЛЬ ДЛЯ РАБОТЫ С ФОТО ==========

// Функция для сильного сжатия изображения (до 30-40KB)
async function compressImageForSheet(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                // Сильно уменьшаем размеры
                let width = img.width;
                let height = img.height;
                
                // Максимальный размер - 400px (было 600)
                const maxSize = 400;
                if (width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                }
                if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
                
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Начинаем с низкого качества 0.5 и уменьшаем если нужно
                const tryQuality = (q) => {
                    canvas.toBlob((blob) => {
                        const sizeKB = blob.size / 1024;
                        console.log(`Пробуем качество ${Math.round(q * 100)}%: ${sizeKB.toFixed(0)}KB`);
                        
                        // Цель - 35KB (чтобы base64 был ~45KB)
                        if (blob.size > 35 * 1024 && q > 0.2) {
                            tryQuality(q - 0.1);
                        } else {
                            console.log(`✅ Фото сжато до ${sizeKB.toFixed(0)}KB`);
                            resolve(blob);
                        }
                    }, 'image/jpeg', q);
                };
                tryQuality(0.5);
            };
        };
    });
}

async function loadPhotoPreview(itemId) {
    const container = document.getElementById('photoPreviewContainer');
    if (!container) return;
    
    try {
        const url = await getPhotoUrl(itemId);
        
        if (url) {
            container.innerHTML = `<img src="${url}" alt="Фото товара" style="max-width: 100%; max-height: 150px; border-radius: 8px; object-fit: contain; border: 1px solid var(--border-color);"
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
    
    console.log("Выбран файл:", {
        name: file.name,
        type: file.type,
        size: (file.size / 1024).toFixed(2) + " KB"
    });
    
    if (!file.type.startsWith('image/')) {
        showToast("Пожалуйста, выберите изображение", false);
        return;
    }
    
    if (!currentEditId) {
        showToast("Товар не выбран", false);
        return;
    }
    
    showToast("Сжатие фото...", true);
    
    try {
        const compressedBlob = await compressImageForSheet(file);
        const compressedSizeKB = compressedBlob.size / 1024;
        
        if (compressedBlob.size > 45 * 1024) {
            showToast(`Фото всё ещё слишком большое (${compressedSizeKB.toFixed(0)}KB). Попробуйте другое фото.`, false);
            return;
        }
        
        const compressedFile = new File([compressedBlob], 'photo.jpg', { type: 'image/jpeg' });
        showToast(`Размер после сжатия: ${compressedSizeKB.toFixed(0)}KB`, true);
        
        showToast("Загрузка фото...", true);
        const success = await uploadPhoto(currentEditId, compressedFile);
        
        if (success) {
            await loadPhotoPreview(currentEditId);
            const fileInput = document.getElementById('photoFileInput');
            if (fileInput) fileInput.value = '';
        }
    } catch(e) {
        console.error("Compression error:", e);
        showToast("Ошибка сжатия фото", false);
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
            content.innerHTML = `<img src="${url}" alt="Фото товара" style="max-width: 100%; max-height: 60vh; border-radius: 12px; object-fit: contain;">`;
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
    
    console.log("Инициализация загрузки фото");
    
    if (uploadBtn) {
        const newUploadBtn = uploadBtn.cloneNode(true);
        uploadBtn.parentNode.replaceChild(newUploadBtn, uploadBtn);
        
        newUploadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Кнопка загрузки нажата");
            if (fileInput) fileInput.click();
        });
    }
    
    if (fileInput) {
        const newFileInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newFileInput, fileInput);
        
        newFileInput.addEventListener('change', function(e) {
            console.log("Файл выбран");
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
            console.log("Кнопка удаления нажата");
            handleDeletePhoto();
        });
    }
}
