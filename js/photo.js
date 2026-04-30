// ========== МОДУЛЬ ДЛЯ РАБОТЫ С ФОТО ==========

// Функция для сжатия изображения перед загрузкой (уменьшает до 500KB)
async function compressImageForSheet(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let quality = 0.7;
                let width = img.width;
                let height = img.height;
                
                // Уменьшаем размеры для экономии места
                const maxSize = 600;
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
                
                // Пробуем с разным качеством, пока размер не станет < 500KB
                const tryQuality = (q) => {
                    canvas.toBlob((blob) => {
                        if (blob.size > 500 * 1024 && q > 0.3) {
                            tryQuality(q - 0.1);
                        } else {
                            console.log(`Сжато до ${(blob.size / 1024).toFixed(0)}KB (качество ${Math.round(q * 100)}%)`);
                            resolve(blob);
                        }
                    }, 'image/jpeg', q);
                };
                tryQuality(quality);
            };
        };
    });
}

async function loadPhotoPreview(itemId) {
    const container = document.getElementById('photoPreviewContainer');
    if (!container) return;
    
    try {
        const url = await getPhotoUrl(itemId);
        console.log("URL для превью:", url ? url.substring(0, 100) + "..." : "null");
        
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
    
    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
        showToast("Пожалуйста, выберите изображение", false);
        return;
    }
    
    if (!currentEditId) {
        showToast("Товар не выбран", false);
        return;
    }
    
    showToast("Сжатие фото...", true);
    let fileToUpload = file;
    
    try {
        const compressedBlob = await compressImageForSheet(file);
        fileToUpload = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' });
        showToast(`Размер: ${(fileToUpload.size / 1024).toFixed(0)}KB`, true);
    } catch(e) {
        console.warn("Сжатие не удалось, загружаем оригинал:", e);
        showToast("Сжатие не удалось", false);
    }
    
    showToast("Загрузка фото...", true);
    const success = await uploadPhoto(currentEditId, fileToUpload);
    
    if (success) {
        await loadPhotoPreview(currentEditId);
        // Очищаем input
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
    
    // Настройка кнопки загрузки
    if (uploadBtn) {
        const newUploadBtn = uploadBtn.cloneNode(true);
        uploadBtn.parentNode.replaceChild(newUploadBtn, uploadBtn);
        
        newUploadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Кнопка загрузки нажата");
            if (fileInput) {
                fileInput.click();
            }
        });
    }
    
    // Настройка input файла
    if (fileInput) {
        const newFileInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newFileInput, fileInput);
        
        newFileInput.addEventListener('change', function(e) {
            console.log("Файл выбран");
            const file = e.target.files[0];
            if (file) {
                handlePhotoUpload(e);
            }
        });
    }
    
    // Настройка кнопки удаления
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
