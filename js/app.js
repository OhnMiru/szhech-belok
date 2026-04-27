// ========== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ==========
function initApp() {
    initCustomSelects();
    loadRules();
    loadHistory();
    loadExtraCosts();
    if (CURRENT_USER.role === 'organizer' && typeof loadGlobalExtraCosts === 'function') loadGlobalExtraCosts();
    initDateTimeSelects();
    bindDateTimeEvents();
    initCustomOrder();
    loadData(true, true);
    startAutoRefresh();
    startHistoryAutoSync();
    
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsDropdown = document.getElementById('settingsDropdown');
    const shareStatsBtn = document.getElementById('shareStatsBtn');
    const hideStatsBtn = document.getElementById('hideStatsBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
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
}

document.addEventListener('click', function(event) { 
    if (!event.target.closest('.rule-custom-select')) closeAllRuleSelects(); 
});

window.onclick = function(event) {
    if (event.target === document.getElementById('historyModal')) closeHistory();
    if (event.target === document.getElementById('cartModal')) closeCartModal();
    if (event.target === document.getElementById('rulesModal')) closeRulesModal();
    if (event.target === document.getElementById('statsModal')) closeStatsModal();
    if (event.target === document.getElementById('globalStatsModal')) closeGlobalStatsModal();
    if (event.target === document.getElementById('editProductModal')) closeEditProductModal();
};

document.addEventListener('DOMContentLoaded', () => {
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
    if (searchInput) searchInput.addEventListener('input', () => filterAndSort());
    
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) resetBtn.addEventListener('click', resetAllFilters);
    
    const rulesBtn = document.getElementById('rulesButton');
    if (rulesBtn) rulesBtn.addEventListener('click', openRulesModal);
    
    const statsBtn = document.getElementById('statsButton');
    if (statsBtn) statsBtn.addEventListener('click', openStatsModal);
    
    const globalStatsBtn = document.getElementById('globalStatsBtn');
    if (globalStatsBtn) globalStatsBtn.addEventListener('click', showGlobalStats);
    
    if (!checkExistingAuth()) { 
        // ждём ручного входа 
    }
});
