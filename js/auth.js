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
