// ========== API ФУНКЦИИ (JSONP версия - без CORS) ==========
console.log("🔧 api.js начал загрузку (JSONP версия)");

// ========== ПРЯМОЙ URL GOOGLE APPS SCRIPT ==========
const GS_API_URL = "https://script.google.com/macros/s/AKfycbwxDZU33tlxqiTDpCI9PExR-JMLUfDcEu56nwNLvE0ttS1Gk8sUPRsTP_j5Jl1GWpai/exec";

// ========== JSONP ФУНКЦИЯ ДЛЯ ОБХОДА CORS ==========
async function jsonpRequest(action, extraParams = "") {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
        
        // Строим URL
        let url = `${GS_API_URL}?action=${action}&participant=${window.CURRENT_USER?.id || ''}${extraParams}&callback=${callbackName}&_=${Date.now()}`;
        
        // Добавляем realUser параметр если есть
        if (typeof window.getRealUserParam === 'function') {
            const realUserParam = window.getRealUserParam();
            if (realUserParam) {
                url += realUserParam;
            }
        }
        
        // Ограничиваем длину URL (JSONP имеет ограничения ~2000 символов)
        if (url.length > 2000) {
            console.warn(`URL слишком длинный (${url.length} символов) для ${action}`);
            reject(new Error('URL too long for JSONP'));
            return;
        }
        
        // Создаём глобальную callback функцию
        window[callbackName] = (data) => {
            delete window[callbackName];
            if (script.parentNode) document.body.removeChild(script);
            resolve(data);
        };
        
        // Создаём и добавляем script тег
        const script = document.createElement('script');
        script.src = url;
        script.onerror = () => {
            delete window[callbackName];
            if (script.parentNode) document.body.removeChild(script);
            reject(new Error(`JSONP request failed for ${action}`));
        };
        
        document.body.appendChild(script);
        
        // Таймаут на случай зависания
        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                if (script.parentNode) document.body.removeChild(script);
                reject(new Error(`JSONP timeout for ${action}`));
            }
        }, 30000);
    });
}

// ========== ПЕРЕХВАТ ВСЕХ FETCH ЗАПРОСОВ ==========
// Сохраняем оригинальный fetch
window.originalFetch = window.fetch;

// Переопределяем fetch для перехвата запросов к Google Apps Script
window.fetch = function(url, options) {
    // Проверяем, является ли запрос к нашему API
    if (typeof url === 'string' && (url.includes(GS_API_URL) || url.includes(window.CENTRAL_API_URL))) {
        console.log(`🔄 Перехват fetch запроса: ${url.substring(0, 100)}...`);
        
        try {
            // Парсим URL
            const urlObj = new URL(url);
            const action = urlObj.searchParams.get('action');
            
            if (!action) {
                console.warn('Нет action в URL');
                return window.originalFetch(url, options);
            }
            
            // Собираем все параметры кроме action, participant, callback, t
            const params = {};
            for (const [key, value] of urlObj.searchParams.entries()) {
                if (key !== 'action' && key !== 'participant' && key !== 'callback' && key !== 't' && key !== '_') {
                    params[key] = value;
                }
            }
            
            // Строим строку параметров
            let paramsStr = '';
            for (const [key, value] of Object.entries(params)) {
                paramsStr += `&${key}=${value}`;
            }
            
            // Для POST запросов с body, данные могут быть в options.body
            if (options?.body && typeof options.body === 'string') {
                // Добавляем параметры из body
                const bodyParams = new URLSearchParams(options.body);
                for (const [key, value] of bodyParams.entries()) {
                    if (key !== 'action' && key !== 'participant') {
                        paramsStr += `&${key}=${encodeURIComponent(value)}`;
                    }
                }
            }
            
            // Выполняем JSONP запрос
            return jsonpRequest(action, paramsStr).then(data => {
                // Возвращаем объект, имитирующий Response
                return {
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: new Map(),
                    json: () => Promise.resolve(data),
                    text: () => Promise.resolve(JSON.stringify(data)),
                    clone: function() { return this; }
                };
            }).catch(error => {
                console.error(`❌ JSONP запрос failed для ${action}:`, error);
                return {
                    ok: false,
                    status: 500,
                    statusText: error.message,
                    headers: new Map(),
                    json: () => Promise.resolve({ success: false, error: error.message }),
                    text: () => Promise.resolve(JSON.stringify({ success: false, error: error.message })),
                    clone: function() { return this; }
                };
            });
        } catch(e) {
            console.error('Ошибка перехвата fetch:', e);
            return window.originalFetch(url, options);
        }
    }
    
    // Для всех остальных запросов используем оригинальный fetch
    return window.originalFetch(url, options);
};

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function buildApiUrl(action, extraParams = "") {
    // Для обратной совместимости
    if (!window.CURRENT_USER?.id) return "#";
    
    let realUserParam = "";
    if (typeof window.getRealUserParam === 'function') {
        realUserParam = window.getRealUserParam();
    }
    
    return `${GS_API_URL}?action=${action}&participant=${window.CURRENT_USER.id}${extraParams}${realUserParam}&t=${Date.now()}`;
}

// ========== ФУНКЦИИ ДЛЯ ЗАГРУЗКИ КОНФИГУРАЦИИ ТИПОВ МЕРЧА ==========

async function loadMerchTypesConfig() {
    if (!window.isOnline) {
        const saved = localStorage.getItem('merch_types_config');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                window.merchTypesConfig = config.types || [];
                updateMerchTypesCache();
                window.merchTypesLoaded = true;
                console.log("✅ Конфигурация типов из localStorage:", window.merchTypesConfig.length);
                return true;
            } catch(e) { console.error(e); }
        }
        return false;
    }
    
    try {
        const result = await jsonpRequest("getMerchTypes");
        
        if (result && result.types) {
            window.merchTypesConfig = result.types;
            updateMerchTypesCache();
            window.merchTypesLoaded = true;
            localStorage.setItem('merch_types_config', JSON.stringify({ types: result.types, loaded: Date.now() }));
            console.log("✅ Конфигурация типов загружена:", window.merchTypesConfig.length);
            return true;
        }
        return false;
    } catch(e) {
        console.error("Ошибка загрузки:", e);
        const saved = localStorage.getItem('merch_types_config');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                window.merchTypesConfig = config.types || [];
                updateMerchTypesCache();
                window.merchTypesLoaded = true;
                return true;
            } catch(e2) { }
        }
        return false;
    }
}

function updateMerchTypesCache() {
    window.merchTypesCache.clear();
    for (const typeConfig of window.merchTypesConfig) {
        if (typeConfig && typeConfig.type) {
            window.merchTypesCache.set(typeConfig.type.toLowerCase(), typeConfig);
        }
    }
}

function getTypeConfigFromCache(typeName) {
    if (!typeName) return null;
    return window.merchTypesCache.get(typeName.toLowerCase()) || null;
}

function getAllMerchTypes() {
    return window.merchTypesConfig.map(t => t.type);
}

// ========== ОСНОВНЫЕ ФУНКЦИИ ==========
async function loadData(showLoading = true, showProgress = false) {
    console.log("✅ loadData ВЫЗВАНА!");
    if (window.isLoading) return;
    window.isLoading = true;
    
    const isAutoRefresh = showProgress && !showLoading;
    if (!isAutoRefresh) {
        const autoRefreshBadge = document.querySelector('.auto-refresh-badge');
        if (autoRefreshBadge) { autoRefreshBadge.style.opacity = '0'; autoRefreshBadge.style.visibility = 'hidden'; }
        if (showProgress && typeof showProgressBar === 'function') showProgressBar();
        if (showLoading) { 
            const container = document.getElementById('cards-container'); 
            if (container) container.innerHTML = '<div class="loading">Загрузка бананчиков...</div>'; 
        }
    }
    
    try {
        const data = await jsonpRequest("get");
        console.log("Данные получены:", data?.length || 0);
        
        if (data && data.length > 0) {
            for (const item of data) {
                if (item.attribute1 === undefined) item.attribute1 = "";
                if (item.attribute2 === undefined) item.attribute2 = "";
            }
            window.originalCardsData = data;
            if (typeof window.updateTypeOptions === 'function') window.updateTypeOptions();
            if (typeof window.filterAndSort === 'function') window.filterAndSort();
            if (typeof window.showUpdateTime === 'function') window.showUpdateTime();
            if (typeof window.updateCartUI === 'function') window.updateCartUI();
            if (typeof window.loadAllComments === 'function') {
                window.loadAllComments();
            }
        } else if (showLoading && !isAutoRefresh) {
            const container = document.getElementById('cards-container');
            if (container) container.innerHTML = '<div class="loading">Нет данных. Проверьте таблицу и лист "Мерч".</div>';
        }
    } catch (error) {
        console.error("loadData error:", error);
        if (showLoading && !isAutoRefresh) {
            const container = document.getElementById('cards-container');
            if (container) container.innerHTML = '<div class="loading">Ошибка загрузки. Проверьте интернет.</div>';
        }
    } finally {
        window.isLoading = false;
        if (!isAutoRefresh) {
            if (showProgress && typeof hideProgressBar === 'function') hideProgressBar();
            const autoRefreshBadge = document.querySelector('.auto-refresh-badge');
            if (autoRefreshBadge) { autoRefreshBadge.style.opacity = ''; autoRefreshBadge.style.visibility = ''; }
        }
    }
}

// Экспорт функций в глобальную область
window.buildApiUrl = buildApiUrl;
window.loadData = loadData;
window.loadMerchTypesConfig = loadMerchTypesConfig;
window.getTypeConfigFromCache = getTypeConfigFromCache;
window.getAllMerchTypes = getAllMerchTypes;
window.jsonpRequest = jsonpRequest;

console.log("✅ api.js загружен (JSONP версия)");
console.log("✅ GS_API_URL:", GS_API_URL);
console.log("✅ Fetch перехват активирован");
