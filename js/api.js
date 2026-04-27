// ========== API ФУНКЦИИ ==========
function buildApiUrl(action, extraParams = "") {
    if (!CURRENT_USER.id) return "#";
    return `${CENTRAL_API_URL}?action=${action}&participant=${CURRENT_USER.id}${extraParams}&t=${Date.now()}`;
}

async function loadData(showLoading = true, showProgress = false) {
    if (isLoading) return;
    isLoading = true;
    const isAutoRefresh = showProgress && !showLoading;
    if (!isAutoRefresh) {
        const autoRefreshBadge = document.querySelector('.auto-refresh-badge');
        if (autoRefreshBadge) { autoRefreshBadge.style.opacity = '0'; autoRefreshBadge.style.visibility = 'hidden'; }
        if (showProgress) showProgressBar();
        if (showLoading) { const container = document.getElementById('cards-container'); if (container) container.innerHTML = '<div class="loading">Загрузка бананчиков...</div>'; }
    }
    try {
        const response = await fetch(buildApiUrl("get"));
        const data = await response.json();
        if (data && data.length > 0) {
            originalCardsData = data;
            updateTypeOptions();
            filterAndSort();
            showUpdateTime();
            updateCartUI();
        } else if (showLoading && !isAutoRefresh) {
            const container = document.getElementById('cards-container');
            if (container) container.innerHTML = '<div class="loading">Нет данных. Проверьте таблицу и лист "Мерч". 🍌</div>';
        }
    } catch (error) {
        console.error(error);
        if (showLoading && !isAutoRefresh) {
            const container = document.getElementById('cards-container');
            if (container) container.innerHTML = '<div class="loading">Ошибка загрузки. Проверьте интернет и ссылку. 🍌</div>';
        }
    } finally {
        isLoading = false;
        if (!isAutoRefresh) {
            if (showProgress) hideProgressBar();
            const autoRefreshBadge = document.querySelector('.auto-refresh-badge');
            if (autoRefreshBadge) { autoRefreshBadge.style.opacity = ''; autoRefreshBadge.style.visibility = ''; }
        }
    }
}
