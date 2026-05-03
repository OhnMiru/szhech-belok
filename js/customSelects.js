// ========== КАСТОМНЫЕ СЕЛЕКТОРЫ ==========

function createCustomSelect(containerId, options, selectedValue, onSelect) {
    let container = document.getElementById(containerId);
    
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.display = 'inline-block';
        const parent = document.getElementById(containerId.replace(/_[^_]+$/, ''));
        if (parent) {
            parent.appendChild(container);
        } else {
            return null;
        }
    }
    
    container.innerHTML = '';
    
    const selectedOption = options.find(opt => opt.value == selectedValue);
    let displayText = selectedOption ? selectedOption.label : options[0]?.label || 'Выберите';
    
    const customSelect = document.createElement('div');
    customSelect.style.position = 'relative';
    customSelect.style.display = 'inline-block';
    customSelect.style.margin = '0 2px';
    
    const trigger = document.createElement('div');
    trigger.style.cssText = 'background: var(--badge-bg); border: 1px solid var(--border-color); border-radius: 20px; padding: 6px 22px 6px 14px; font-size: 12px; cursor: pointer; white-space: nowrap; color: var(--text-primary); display: inline-block; font-family: monospace; min-width: 50px; text-align: center;';
    trigger.textContent = displayText;
    
    const arrow = document.createElement('span');
    arrow.style.cssText = 'position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 9px; color: var(--text-secondary);';
    arrow.textContent = '▼';
    trigger.appendChild(arrow);
    
    const dropdown = document.createElement('div');
    dropdown.style.cssText = 'position: absolute; top: 100%; left: 0; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; z-index: 1000; display: none; max-height: 200px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px var(--shadow); min-width: 110px;';
    
    options.forEach(opt => {
        const optionDiv = document.createElement('div');
        optionDiv.style.cssText = 'padding: 8px 12px; cursor: pointer; transition: background 0.1s; font-size: 12px; color: var(--text-primary); white-space: nowrap;';
        optionDiv.textContent = opt.label;
        optionDiv.dataset.value = opt.value;
        
        if (opt.value == selectedValue) {
            optionDiv.style.background = 'var(--badge-bg)';
            optionDiv.style.fontWeight = 'bold';
        }
        
        optionDiv.addEventListener('click', () => {
            trigger.childNodes[0].textContent = opt.label;
            dropdown.style.display = 'none';
            if (onSelect) onSelect(opt.value, opt.label);
            if (typeof renderHistoryList === 'function') {
                setTimeout(() => renderHistoryList(), 10);
            }
        });
        
        optionDiv.addEventListener('mouseenter', () => {
            optionDiv.style.background = 'var(--badge-bg)';
        });
        optionDiv.addEventListener('mouseleave', () => {
            if (opt.value != selectedValue) {
                optionDiv.style.background = '';
            }
        });
        
        dropdown.appendChild(optionDiv);
    });
    
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.style.display === 'block';
        document.querySelectorAll('.custom-select-flat-dropdown, div[style*="position: absolute"]').forEach(d => {
            if (d !== dropdown && d.parentElement !== customSelect) d.style.display = 'none';
        });
        dropdown.style.display = isOpen ? 'none' : 'block';
    });
    
    customSelect.appendChild(trigger);
    customSelect.appendChild(dropdown);
    container.appendChild(customSelect);
    
    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    
    return { trigger, dropdown, customSelect };
}

// Для блока "от" (dateFrom...)
function createCustomDateGroupFrom(containerId, dayValue, monthValue, yearValue) {
    let container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }
    
    container.innerHTML = '';
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.gap = '6px';
    container.style.backgroundColor = 'transparent';
    container.style.padding = '0';
    container.style.border = 'none';
    
    const daysOptions = [];
    for (let i = 1; i <= 31; i++) {
        daysOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    createCustomSelect(containerId + '_day', daysOptions, dayValue, (value) => {
        const hiddenSelect = document.getElementById('dateFromDay');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const monthsOptions = [];
    for (let i = 0; i < 12; i++) {
        monthsOptions.push({ value: i + 1, label: monthNames[i] });
    }
    createCustomSelect(containerId + '_month', monthsOptions, monthValue, (value) => {
        const hiddenSelect = document.getElementById('dateFromMonth');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    const currentYear = new Date().getFullYear();
    const yearsOptions = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
        yearsOptions.push({ value: i, label: i.toString() });
    }
    createCustomSelect(containerId + '_year', yearsOptions, yearValue, (value) => {
        const hiddenSelect = document.getElementById('dateFromYear');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
}

// Для блока "до" (dateTo...)
function createCustomDateGroupTo(containerId, dayValue, monthValue, yearValue) {
    let container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }
    
    container.innerHTML = '';
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.gap = '6px';
    container.style.backgroundColor = 'transparent';
    container.style.padding = '0';
    container.style.border = 'none';
    
    const daysOptions = [];
    for (let i = 1; i <= 31; i++) {
        daysOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    createCustomSelect(containerId + '_day', daysOptions, dayValue, (value) => {
        const hiddenSelect = document.getElementById('dateToDay');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const monthsOptions = [];
    for (let i = 0; i < 12; i++) {
        monthsOptions.push({ value: i + 1, label: monthNames[i] });
    }
    createCustomSelect(containerId + '_month', monthsOptions, monthValue, (value) => {
        const hiddenSelect = document.getElementById('dateToMonth');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    const currentYear = new Date().getFullYear();
    const yearsOptions = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
        yearsOptions.push({ value: i, label: i.toString() });
    }
    createCustomSelect(containerId + '_year', yearsOptions, yearValue, (value) => {
        const hiddenSelect = document.getElementById('dateToYear');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
}

// Для времени "от" (timeFrom...)
function createCustomTimeGroupFrom(containerId, hourValue, minuteValue) {
    let container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }
    
    container.innerHTML = '';
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.gap = '6px';
    container.style.backgroundColor = 'transparent';
    container.style.padding = '0';
    container.style.border = 'none';
    
    const hoursOptions = [];
    for (let i = 0; i <= 23; i++) {
        hoursOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    createCustomSelect(containerId + '_hour', hoursOptions, hourValue, (value) => {
        const hiddenSelect = document.getElementById('timeFromHour');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    const minutesOptions = [];
    for (let i = 0; i <= 59; i++) {
        minutesOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    createCustomSelect(containerId + '_minute', minutesOptions, minuteValue, (value) => {
        const hiddenSelect = document.getElementById('timeFromMinute');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
}

// Для времени "до" (timeTo...)
function createCustomTimeGroupTo(containerId, hourValue, minuteValue) {
    let container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }
    
    container.innerHTML = '';
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.gap = '6px';
    container.style.backgroundColor = 'transparent';
    container.style.padding = '0';
    container.style.border = 'none';
    
    const hoursOptions = [];
    for (let i = 0; i <= 23; i++) {
        hoursOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    createCustomSelect(containerId + '_hour', hoursOptions, hourValue, (value) => {
        const hiddenSelect = document.getElementById('timeToHour');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    const minutesOptions = [];
    for (let i = 0; i <= 59; i++) {
        minutesOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    createCustomSelect(containerId + '_minute', minutesOptions, minuteValue, (value) => {
        const hiddenSelect = document.getElementById('timeToMinute');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
}

// Инициализация
function initCustomDateTimeSelects() {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    createCustomDateGroupFrom('dateFromDateGroup', currentDay, currentMonth, currentYear);
    createCustomTimeGroupFrom('dateFromTimeGroup', 0, 0);
    createCustomDateGroupTo('dateToDateGroup', currentDay, currentMonth, currentYear);
    createCustomTimeGroupTo('dateToTimeGroup', 23, 59);
}

// Для статистики и глобальной статистики (заглушки)
function initCustomStatsDateTimeSelects() {
    // Можно добавить позже по аналогии
}

function initCustomGlobalStatsDateTimeSelects() {
    // Можно добавить позже по аналогии
}
