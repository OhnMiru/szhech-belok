// ========== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ==========
function initApp() {
    console.log("Инициализация приложения...");
    
    // Проверяем, что все необходимые функции загружены
    if (typeof initCustomSelects !== 'function') {
        console.error("initCustomSelects not loaded");
        return;
    }
    if (typeof loadRules !== 'function') {
        console.error("loadRules not loaded");
        return;
    }
    if (typeof loadHistory !== 'function') {
        console.error("loadHistory not loaded");
        return;
    }
    if (typeof loadExtraCosts !== 'function') {
        console.error("loadExtraCosts not loaded");
        return;
    }
    if (typeof loadExtraIncomes !== 'function') {
        console.error("loadExtraIncomes not loaded");
        return;
    }
    if (typeof loadData !== 'function') {
        console.error("loadData not loaded");
        return;
    }
    
    initCustomSelects();
    loadRules();
    loadHistory();
    loadExtraCosts();
    loadExtraIncomes();
    
    if (CURRENT_USER.role === 'organizer') {
        if (typeof loadGlobalExtraCosts === 'function') loadGlobalExtraCosts();
        if (typeof loadGlobalExtraIncomes === 'function') loadGlobalExtraIncomes();
    }
    
    if (typeof initDateTimeSelects === 'function') initDateTimeSelects();
    if (typeof bindDateTimeEvents === 'function') bindDateTimeEvents();
    if (typeof initCustomOrder === 'function') initCustomOrder();
    
    // Загружаем данные
    loadData(true, true);
    
    // Запускаем автообновление
    startAutoRefresh();
    startHistoryAutoSync();
    
    // Загружаем бронирования
    if (typeof loadBookings === 'function') {
        loadBookings().catch(e => console.warn("Bookings load error:", e));
    }
    
    // Настраиваем кнопки
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsDropdown = document.getElementById('settingsDropdown');
    const shareStatsBtn = document.getElementById('shareStatsBtn');
    const hideStatsBtn = document.getElementById('hideStatsBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const bookingsBtn = document.getElementById('bookingsButton');
    const addItemBtn = document.getElementById('addItemButton');
    const supplyBtn = document.getElementById('supplyButton');
  
    if (bookingsBtn) {
        bookingsBtn.addEventListener('click', openBookingsModal);
    }
    
    if (addItemBtn) {
        addItemBtn.addEventListener('click', openAddItemModal);
    }
    
    if (supplyBtn) {
        supplyBtn.addEventListener('click', openSupplyModal);
    }

    if (settingsToggle) {
        settingsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsDropdown.classList.toggle('hidden');
        });
    }
    
    if (shareStatsBtn) {
        shareStatsBtn.addEventListener('click', () => {
            toggleShareStats();
            settingsDropdown.classList.add('hidden');
        });
    }
    
    if (hideStatsBtn) {
        hideStatsBtn.addEventListener('click', () => {
            toggleHideStats();
            settingsDropdown.classList.add('hidden');
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
            settingsDropdown.classList.add('hidden');
        });
    }

    document.addEventListener('click', (e) => {
        if (settingsDropdown && !settingsToggle?.contains(e.target) && !settingsDropdown.contains(e.target))
            settingsDropdown.classList.add('hidden');
    });
    
    // Загружаем комментарии после инициализации
    if (typeof loadAllComments === 'function') {
        loadAllComments();
    }
    
    console.log("Инициализация приложения завершена");
}

// Обработчик кликов для закрытия модальных окон
document.addEventListener('click', function(event) {
    if (!event.target.closest('.rule-custom-select')) {
        if (typeof closeAllRuleSelects === 'function') closeAllRuleSelects();
    }
});

window.onclick = function(event) {
    const historyModal = document.getElementById('historyModal');
    const cartModal = document.getElementById('cartModal');
    const rulesModal = document.getElementById('rulesModal');
    const statsModal = document.getElementById('statsModal');
    const globalStatsModal = document.getElementById('globalStatsModal');
    const editProductModal = document.getElementById('editProductModal');
    const addItemModal = document.getElementById('addItemModal');
    const photoViewModal = document.getElementById('photoViewModal');
    const bookingsModal = document.getElementById('bookingsModal');
    const supplyModal = document.getElementById('supplyModal');
    const commentModal = document.getElementById('commentModal');
    
    if (event.target === historyModal && typeof closeHistory === 'function') closeHistory();
    if (event.target === cartModal && typeof closeCartModal === 'function') closeCartModal();
    if (event.target === rulesModal && typeof closeRulesModal === 'function') closeRulesModal();
    if (event.target === statsModal && typeof closeStatsModal === 'function') closeStatsModal();
    if (event.target === globalStatsModal && typeof closeGlobalStatsModal === 'function') closeGlobalStatsModal();
    if (event.target === editProductModal && typeof closeEditProductModal === 'function') closeEditProductModal();
    if (event.target === addItemModal && typeof closeAddItemModal === 'function') closeAddItemModal();
    if (event.target === photoViewModal && typeof closePhotoModal === 'function') closePhotoModal();
    if (event.target === bookingsModal && typeof closeBookingsModal === 'function') closeBookingsModal();
    if (event.target === supplyModal && typeof closeSupplyModal === 'function') closeSupplyModal();
    if (event.target === commentModal && typeof closeCommentModal === 'function') closeCommentModal();
};

// Инициализация после полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM полностью загружен");
    
    initTheme();
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.addEventListener('click', login);

    const loginInput = document.getElementById('loginInput');
    const passwordInput2 = document.getElementById('passwordInput');
    if (loginInput) loginInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') login(); });
    if (passwordInput2) passwordInput2.addEventListener('keypress', (e) => { if (e.key === 'Enter') login(); });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', () => {
        if (typeof filterAndSort === 'function') filterAndSort();
    });

    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) resetBtn.addEventListener('click', () => {
        if (typeof resetAllFilters === 'function') resetAllFilters();
    });

    const rulesBtn = document.getElementById('rulesButton');
    if (rulesBtn) rulesBtn.addEventListener('click', () => {
        if (typeof openRulesModal === 'function') openRulesModal();
    });

    const statsBtn = document.getElementById('statsButton');
    if (statsBtn) statsBtn.addEventListener('click', () => {
        if (typeof openStatsModal === 'function') openStatsModal();
    });

    const globalStatsBtn = document.getElementById('globalStatsBtn');
    if (globalStatsBtn) globalStatsBtn.addEventListener('click', () => {
        if (typeof showGlobalStats === 'function') showGlobalStats();
    });

    const bookingsBtn = document.getElementById('bookingsButton');
    if (bookingsBtn) bookingsBtn.addEventListener('click', () => {
        if (typeof openBookingsModal === 'function') openBookingsModal();
    });
    
    const addItemBtn = document.getElementById('addItemButton');
    if (addItemBtn) addItemBtn.addEventListener('click', () => {
        if (typeof openAddItemModal === 'function') openAddItemModal();
    });
    
    const supplyBtn = document.getElementById('supplyButton');
    if (supplyBtn) supplyBtn.addEventListener('click', () => {
        if (typeof openSupplyModal === 'function') openSupplyModal();
    });

    // Проверяем авторизацию
    if (!checkExistingAuth()) {
        console.log("Ожидание ручного входа");
    } else {
        // Если уже авторизованы, запускаем приложение
        setTimeout(() => {
            initApp();
        }, 100);
    }
});
