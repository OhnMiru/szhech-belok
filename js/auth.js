// ========== НАСТРОЙКИ КОНФИДЕНЦИАЛЬНОСТИ ==========
async function savePrivacySettings() {
    if (!isOnline) {
        addPendingOperation("savePrivacy", `&data=${encodeURIComponent(JSON.stringify({ shareStats: CURRENT_USER.shareStats, hideStats: CURRENT_USER.hideStats }))}`);
        return;
    }
    try {
        const data = encodeURIComponent(JSON.stringify({
            shareStats: CURRENT_USER.shareStats,
            hideStats: CURRENT_USER.hideStats
        }));
        await fetch(buildApiUrl("savePrivacy", `&data=${data}`));
    } catch(e) { 
        console.error(e); 
        addPendingOperation("savePrivacy", `&data=${encodeURIComponent(JSON.stringify({ shareStats: CURRENT_USER.shareStats, hideStats: CURRENT_USER.hideStats }))}`);
    }
}

async function loadPrivacySettings() {
    if (!isOnline) {
        const saved = localStorage.getItem('merch_privacy');
        if (saved) {
            const parsed = JSON.parse(saved);
            CURRENT_USER.shareStats = parsed.shareStats === true;
            CURRENT_USER.hideStats = parsed.hideStats === true;
            updatePrivacyButtonsUI();
        }
        return;
    }
    try {
        const response = await fetch(buildApiUrl("getPrivacy"));
        const data = await response.json();
        if (data) {
            CURRENT_USER.shareStats = data.shareStats === true;
            CURRENT_USER.hideStats = data.hideStats === true;
            updatePrivacyButtonsUI();
        }
    } catch(e) {
        const saved = localStorage.getItem('merch_privacy');
        if (saved) {
            const parsed = JSON.parse(saved);
            CURRENT_USER.shareStats = parsed.shareStats === true;
            CURRENT_USER.hideStats = parsed.hideStats === true;
            updatePrivacyButtonsUI();
        }
    }
}

function updatePrivacyButtonsUI() {
    const shareBtn = document.getElementById('shareStatsBtn');
    const hideBtn = document.getElementById('hideStatsBtn');
    if (shareBtn) {
        shareBtn.innerHTML = CURRENT_USER.shareStats ? '🔗 Делиться статистикой анонимно ✅' : '🔗 Делиться статистикой анонимно';
        shareBtn.style.opacity = CURRENT_USER.shareStats ? '1' : '0.7';
    }
    if (hideBtn) {
        hideBtn.innerHTML = CURRENT_USER.hideStats ? '🚫 Не учитывать мою статистику ✅' : '🚫 Не учитывать мою статистику';
        hideBtn.style.opacity = CURRENT_USER.hideStats ? '1' : '0.7';
    }
}

function toggleShareStats() {
    CURRENT_USER.shareStats = !CURRENT_USER.shareStats;
    if (CURRENT_USER.shareStats && CURRENT_USER.hideStats) {
        CURRENT_USER.hideStats = false;
    }
    updatePrivacyButtonsUI();
    localStorage.setItem('merch_privacy', JSON.stringify({
        shareStats: CURRENT_USER.shareStats,
        hideStats: CURRENT_USER.hideStats
    }));
    savePrivacySettings();
    showToast(CURRENT_USER.shareStats ? 'Анонимная статистика включена' : 'Анонимная статистика отключена', true);
}

function toggleHideStats() {
    CURRENT_USER.hideStats = !CURRENT_USER.hideStats;
    if (CURRENT_USER.hideStats && CURRENT_USER.shareStats) {
        CURRENT_USER.shareStats = false;
    }
    updatePrivacyButtonsUI();
    localStorage.setItem('merch_privacy', JSON.stringify({
        shareStats: CURRENT_USER.shareStats,
        hideStats: CURRENT_USER.hideStats
    }));
    savePrivacySettings();
    showToast(CURRENT_USER.hideStats ? 'Ваша статистика скрыта от организатора' : 'Ваша статистика видна организатору', true);
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('passwordInput');
    const toggleBtn = document.querySelector('.toggle-password');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = '👁️';
    }
}

// ========== ВХОД ==========
async function login() {
    const loginInput = document.getElementById('loginInput');
    const passwordInput = document.getElementById('passwordInput');
    const errorMsg = document.getElementById('errorMsg');
    
    const login = loginInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    
    if (!login || !password) {
        errorMsg.style.display = 'block';
        errorMsg.textContent = 'Введите логин и пароль';
        return;
    }
    
    errorMsg.style.display = 'none';
    
    try {
        const response = await fetch(`${CENTRAL_API_URL}?action=checkPassword&user=${encodeURIComponent(login)}&pwd=${encodeURIComponent(password)}`);
        const result = await response.json();
        
        if (result.success) {
            CURRENT_USER.id = login;
            CURRENT_USER.name = result.name || login;
            CURRENT_USER.role = result.role || 'artist';
            CURRENT_USER.sheetUrl = result.sheetUrl || '#';
            
            sessionStorage.setItem('currentUser', JSON.stringify({
                id: CURRENT_USER.id,
                name: CURRENT_USER.name,
                role: CURRENT_USER.role,
                sheetUrl: CURRENT_USER.sheetUrl
            }));
            
            await loadPrivacySettings();
            loadPendingOperations();
            
            document.getElementById('loginOverlay').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
            
            const roleIcon = CURRENT_USER.role === 'organizer' ? '📊' : '🍌';
            document.getElementById('shopTitle').innerHTML = `${roleIcon} ${CURRENT_USER.name} — учёт мерча`;
            
            const sheetLink = document.getElementById('sheetLink');
            if (sheetLink && CURRENT_USER.sheetUrl && CURRENT_USER.sheetUrl !== '#') {
                sheetLink.href = CURRENT_USER.sheetUrl;
            }
            
            if (CURRENT_USER.role === 'organizer') {
                const globalStatsBtn = document.getElementById('globalStatsBtn');
                if (globalStatsBtn) globalStatsBtn.style.display = 'inline-flex';
                // Показываем кнопку/модуль "Другие пользователи" для организатора
                showImpersonateUI();
            }
            
            initApp();
            processPendingOperations();
        } else {
            errorMsg.style.display = 'block';
            errorMsg.textContent = result.error || 'Неверный логин или пароль';
            passwordInput.value = '';
        }
    } catch (error) {
        errorMsg.style.display = 'block';
        errorMsg.textContent = 'Ошибка соединения. Попробуйте позже.';
        console.error(error);
    }
}

function checkExistingAuth() {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            CURRENT_USER.id = user.id;
            CURRENT_USER.name = user.name;
            CURRENT_USER.role = user.role;
            CURRENT_USER.sheetUrl = user.sheetUrl;
            
            document.getElementById('loginOverlay').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
            
            const roleIcon = CURRENT_USER.role === 'organizer' ? '📊' : '🍌';
            document.getElementById('shopTitle').innerHTML = `${roleIcon} ${CURRENT_USER.name} — учёт мерча`;
            
            const sheetLink = document.getElementById('sheetLink');
            if (sheetLink && CURRENT_USER.sheetUrl && CURRENT_USER.sheetUrl !== '#') {
                sheetLink.href = CURRENT_USER.sheetUrl;
            }
            
            if (CURRENT_USER.role === 'organizer') {
                const globalStatsBtn = document.getElementById('globalStatsBtn');
                if (globalStatsBtn) globalStatsBtn.style.display = 'inline-flex';
                showImpersonateUI();
            }
            
            loadPrivacySettings().then(() => {
                loadPendingOperations();
                initApp();
                processPendingOperations();
            });
            return true;
        } catch(e) {}
    }
    
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
    return false;
}

function logout() {
    // Выход из режима подмены, если он был активен
    if (isImpersonating) {
        stopImpersonating();
    }
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_time');
    CURRENT_USER.id = null;
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('loginInput').value = '';
    document.getElementById('passwordInput').value = '';
    document.getElementById('errorMsg').style.display = 'none';
    const dropdown = document.getElementById('settingsDropdown');
    if (dropdown) dropdown.classList.add('hidden');
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    if (historySyncInterval) clearInterval(historySyncInterval);
}

// ========== ФУНКЦИИ ДЛЯ ИМПЕРСОНАЦИИ (ВХОД ОТ ЛИЦА ОРГАНИЗАТОРА) ==========

// Показывает UI для выбора пользователя (только для организатора)
function showImpersonateUI() {
    // Проверяем, есть ли уже модуль
    let impersonateContainer = document.getElementById('impersonateContainer');
    if (!impersonateContainer) {
        // Создаём контейнер в панели управления (рядом с другими кнопками)
        const buttonPanel = document.querySelector('#mainContent > div:first-of-type + div');
        if (buttonPanel) {
            impersonateContainer = document.createElement('div');
            impersonateContainer.id = 'impersonateContainer';
            impersonateContainer.style.display = 'inline-block';
            impersonateContainer.style.marginLeft = 'auto';
            buttonPanel.appendChild(impersonateContainer);
        }
    }
    
    if (impersonateContainer) {
        impersonateContainer.innerHTML = `
            <div class="impersonate-wrapper" style="position: relative; display: inline-block;">
                <button id="impersonateBtn" class="impersonate-btn" style="background: var(--badge-bg); border: 1px solid var(--border-color); border-radius: 30px; padding: 8px 16px; font-size: 13px; cursor: pointer; color: var(--text-primary);">
                    👥 Другие пользователи
                </button>
                <div id="impersonateDropdown" class="impersonate-dropdown hidden" style="position: absolute; top: 100%; right: 0; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 8px; min-width: 200px; z-index: 1000; margin-top: 4px; box-shadow: 0 4px 12px var(--shadow);">
                    <div style="padding: 8px 12px; font-size: 12px; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">Выберите пользователя</div>
                    <div id="impersonateUserList" style="max-height: 200px; overflow-y: auto;"></div>
                </div>
            </div>
        `;
        
        const btn = document.getElementById('impersonateBtn');
        const dropdown = document.getElementById('impersonateDropdown');
        
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('hidden');
                loadImpersonateUserList();
            });
        }
        
        document.addEventListener('click', (e) => {
            if (dropdown && !btn?.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }
}

// Загрузка списка пользователей для имперсонации
async function loadImpersonateUserList() {
    const userListContainer = document.getElementById('impersonateUserList');
    if (!userListContainer) return;
    
    try {
        const response = await fetch(`${CENTRAL_API_URL}?action=getAvailableUsers`);
        const data = await response.json();
        if (data && data.users) {
            // Фильтруем: показываем всех пользователей, кроме текущего
            // Организаторы тоже доступны
            const users = data.users.filter(u => u.id !== CURRENT_USER.id);
            if (users.length === 0) {
                userListContainer.innerHTML = '<div style="padding: 12px; color: var(--text-muted); text-align: center;">Нет других пользователей</div>';
                return;
            }
            
            userListContainer.innerHTML = users.map(user => `
                <div class="impersonate-user-item" data-user-id="${user.id}" data-user-name="${user.name}" data-user-role="${user.role}" style="padding: 10px 12px; cursor: pointer; border-radius: 8px; transition: background 0.2s;">
                    <div style="font-weight: bold;">${escapeHtml(user.name)}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">${user.role === 'organizer' ? 'Организатор' : 'Художник'}</div>
                </div>
            `).join('');
            
            // Добавляем обработчики
            document.querySelectorAll('.impersonate-user-item').forEach(item => {
                item.addEventListener('click', () => {
                    const userId = item.dataset.userId;
                    const userName = item.dataset.userName;
                    const userRole = item.dataset.userRole;
                    impersonateUser(userId, userName, userRole);
                    const dropdown = document.getElementById('impersonateDropdown');
                    if (dropdown) dropdown.classList.add('hidden');
                });
                item.addEventListener('mouseenter', (e) => {
                    e.currentTarget.style.background = 'var(--badge-bg)';
                });
                item.addEventListener('mouseleave', (e) => {
                    e.currentTarget.style.background = '';
                });
            });
        }
    } catch(e) {
        console.error("Error loading users:", e);
        userListContainer.innerHTML = '<div style="padding: 12px; color: var(--minus-color); text-align: center;">Ошибка загрузки</div>';
    }
}

// Вход от лица пользователя
async function impersonateUser(userId, userName, userRole) {
    if (isImpersonating) {
        showToast("Сначала выйдите из текущего режима", false);
        return;
    }
    
    // Сохраняем оригинальные данные
    originalUserId = CURRENT_USER.id;
    originalUserName = CURRENT_USER.name;
    impersonatedUserId = userId;
    impersonatedUserName = userName;
    isImpersonating = true;
    
    // Меняем текущего пользователя
    CURRENT_USER.id = userId;
    CURRENT_USER.name = userName;
    CURRENT_USER.role = userRole;
    CURRENT_USER.sheetUrl = null; // Будет загружено заново
    
    // Обновляем информацию о пользователе
    try {
        const response = await fetch(`${CENTRAL_API_URL}?action=getUserInfo&user=${encodeURIComponent(userId)}`);
        const userInfo = await response.json();
        if (userInfo && userInfo.sheetUrl) {
            CURRENT_USER.sheetUrl = userInfo.sheetUrl;
        }
    } catch(e) {
        console.error("Error getting user info:", e);
    }
    
    // Показываем баннер
    showImpersonateBanner();
    
    // Обновляем интерфейс
    const roleIcon = CURRENT_USER.role === 'organizer' ? '📊' : '🍌';
    document.getElementById('shopTitle').innerHTML = `${roleIcon} ${CURRENT_USER.name} — учёт мерча`;
    
    const sheetLink = document.getElementById('sheetLink');
    if (sheetLink && CURRENT_USER.sheetUrl && CURRENT_USER.sheetUrl !== '#') {
        sheetLink.href = CURRENT_USER.sheetUrl;
    }
    
    // Перезагружаем данные
    if (typeof loadData === 'function') {
        loadData(true, true);
    }
    
    // Обновляем статистику и другие данные
    if (typeof loadHistory === 'function') loadHistory();
    if (typeof loadExtraCosts === 'function') loadExtraCosts();
    if (typeof loadExtraIncomes === 'function') loadExtraIncomes();
    if (typeof loadAllComments === 'function') loadAllComments();
    
    showToast(`Вы вошли как ${userName}`, true);
}

// Показ баннера режима подмены
function showImpersonateBanner() {
    let banner = document.getElementById('impersonateBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'impersonateBanner';
        banner.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #f39c12; color: #333; text-align: center; padding: 8px; font-size: 13px; z-index: 9999; display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap;';
        document.body.appendChild(banner);
    }
    
    banner.innerHTML = `
        <span>⚠️ Вы действуете от лица <strong>${escapeHtml(impersonatedUserName)}</strong> (режим организатора)</span>
        <button id="stopImpersonateBtn" style="background: #e74c3c; color: white; border: none; border-radius: 30px; padding: 4px 16px; font-size: 12px; cursor: pointer;">Выйти</button>
    `;
    
    const stopBtn = document.getElementById('stopImpersonateBtn');
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            stopImpersonating();
        });
    }
    
    banner.style.display = 'flex';
}

// Выход из режима подмены
function stopImpersonating() {
    if (!isImpersonating) return;
    
    // Восстанавливаем оригинальные данные
    CURRENT_USER.id = originalUserId;
    CURRENT_USER.name = originalUserName;
    
    // Получаем роль организатора из оригинальных данных
    // (организатор всегда имеет роль organizer)
    CURRENT_USER.role = 'organizer';
    
    // Восстанавливаем sheetUrl
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            CURRENT_USER.sheetUrl = user.sheetUrl;
        } catch(e) {}
    }
    
    // Сбрасываем флаги
    isImpersonating = false;
    originalUserId = null;
    originalUserName = null;
    impersonatedUserId = null;
    impersonatedUserName = null;
    
    // Убираем баннер
    const banner = document.getElementById('impersonateBanner');
    if (banner) banner.remove();
    
    // Обновляем интерфейс
    const roleIcon = '📊';
    document.getElementById('shopTitle').innerHTML = `${roleIcon} ${CURRENT_USER.name} — учёт мерча`;
    
    const sheetLink = document.getElementById('sheetLink');
    if (sheetLink && CURRENT_USER.sheetUrl && CURRENT_USER.sheetUrl !== '#') {
        sheetLink.href = CURRENT_USER.sheetUrl;
    }
    
    // Перезагружаем данные
    if (typeof loadData === 'function') {
        loadData(true, true);
    }
    if (typeof loadHistory === 'function') loadHistory();
    if (typeof loadExtraCosts === 'function') loadExtraCosts();
    if (typeof loadExtraIncomes === 'function') loadExtraIncomes();
    if (typeof loadAllComments === 'function') loadAllComments();
    
    showToast(`Вы вернулись в свой аккаунт (${CURRENT_USER.name})`, true);
}

// Проверка, нужно ли передавать realUser параметр в API
function getRealUserParam() {
    if (isImpersonating && originalUserId) {
        return `&realUser=${encodeURIComponent(originalUserId)}`;
    }
    return "";
}
