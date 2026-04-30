// ========== МОДУЛЬ ДЛЯ РАБОТЫ С ФОТО ==========

// Функция для сжатия изображения перед загрузкой
async function compressImage(file, maxWidth = 1024, maxHeight = 1024, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                
                // Вычисляем новые размеры с сохранением пропорций
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
                
                // Создаём canvas для сжатия
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Конвертируем в JPEG с заданным качеством
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', quality);
            };
            img.onerror = (err) => {
                console.error("Image load error:", err);
                reject(err);
            };
        };
        reader.onerror = (err) => {
            console.error("FileReader error:", err);
            reject(err);
        };
    });
}

async function loadPhotoPreview(itemId) {
    const container = document.getElementById('photoPreviewContainer');
    if (!container) return;
    
    try {
        const url = await getPhotoUrl(itemId);
        console.log("Got URL for preview:", url);
        
        if (url) {
            // Прямая вставка ссылки с отладочной информацией
            container.innerHTML = `
                <div style="background: #f0f0f0; padding: 8px; border-radius: 8px; font-size: 11px; word-break: break-all;">
                    <div>URL: ${url.substring(0, 80)}...</div>
                    <img src="${url}" alt="Фото" style="max-width: 100%; max-height: 120px; border-radius: 8px; margin-top: 8px;" 
                         onerror="console.error('Image failed to load:', this.src); this.parentElement.innerHTML+='<div style=\"color:red;\">❌ Ошибка загрузки изображения</div>'">
                </div>
            `;
            const deleteBtn = document.getElementById('deletePhotoBtn');
            if (deleteBtn) deleteBtn.style.display = 'inline-flex';
        } else {
            container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 150px; background: var(--badge-bg); border-radius: 8px; color: var(--text-muted);">📷 Нет фото</div>`;
            const deleteBtn = document.getElementById('deletePhotoBtn');
            if (deleteBtn) deleteBtn.style.display = 'none';
        }
    } catch(e) {
        console.error("Error loading photo preview:", e);
        container.innerHTML = `<div style="color: red;">❌ Ошибка: ${e.message}</div>`;
    }
}

// ИСПРАВЛЕННАЯ ФУНКЦИЯ ОБРАБОТКИ ЗАГРУЗКИ ФОТО с сжатием
async function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log("Selected file:", {
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
    
    let fileToUpload = file;
    
    // Сжимаем фото если оно больше 1 МБ
    if (file.size > 1 * 1024 * 1024) {
        showToast("Сжатие фото...", true);
        try {
            const compressedBlob = await compressImage(file, 1024, 1024, 0.7);
            fileToUpload = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' });
            console.log("Compressed:", {
                originalSize: (file.size / 1024).toFixed(2) + " KB",
                compressedSize: (fileToUpload.size / 1024).toFixed(2) + " KB",
                reduction: ((1 - fileToUpload.size / file.size) * 100).toFixed(1) + "%"
            });
            showToast(`Фото сжато: ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB`, true);
        } catch(e) {
            console.warn("Compression failed, uploading original:", e);
            showToast("Сжатие не удалось, загружаем оригинал", false);
        }
    }
    
    showToast("Загрузка фото...", true);
    const success = await uploadPhoto(currentEditId, fileToUpload);
    
    if (success) {
        await loadPhotoPreview(currentEditId);
        // Очищаем input, чтобы можно было загрузить тот же файл снова
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
    
    // Загружаем фото
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

// ИСПРАВЛЕННАЯ ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ ЗАГРУЗКИ ФОТО
function initPhotoUploadInEditModal() {
    const fileInput = document.getElementById('photoFileInput');
    const deleteBtn = document.getElementById('deletePhotoBtn');
    const uploadBtn = document.getElementById('uploadPhotoBtn');
    
    console.log("Initializing photo upload in edit modal");
    
    // Настройка кнопки загрузки
    if (uploadBtn) {
        // Удаляем старые обработчики
        const newUploadBtn = uploadBtn.cloneNode(true);
        uploadBtn.parentNode.replaceChild(newUploadBtn, uploadBtn);
        
        newUploadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Upload button clicked");
            if (fileInput) {
                fileInput.click();
            } else {
                console.error("File input not found");
            }
        });
        console.log("Upload button handler attached");
    }
    
    // Настройка input файла
    if (fileInput) {
        // Удаляем старые обработчики
        const newFileInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newFileInput, fileInput);
        
        newFileInput.addEventListener('change', function(e) {
            console.log("File input change event triggered");
            const file = e.target.files[0];
            if (file) {
                console.log("File selected:", file.name);
                handlePhotoUpload(e);
            } else {
                console.log("No file selected");
            }
        });
        console.log("File input handler attached");
    } else {
        console.error("File input element not found");
    }
    
    // Настройка кнопки удаления
    if (deleteBtn) {
        const newDeleteBtn = deleteBtn.cloneNode(true);
        deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
        
        newDeleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Delete button clicked");
            handleDeletePhoto();
        });
        console.log("Delete button handler attached");
    }
}
