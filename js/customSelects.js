// ========== КАСТОМНЫЕ СЕЛЕКТОРЫ ==========

// Создать кастомный селектор (без собственной стрелки)
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
    customSelect.className = 'custom-select';
    customSelect.style.position = 'relative';
    customSelect.style.display = 'inline-block';
    customSelect.style.width = 'auto';
    
    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    // Просто текст, без стрелки
    trigger.style.cssText = 'padding: 0; font-size: 12px; cursor: pointer; white-space: nowrap; color: var(--text-primary); display: inline-block; font-family: monospace;';
    trigger.textContent = displayText;
    
    const dropdown = document.createElement('div');
    dropdown.className = 'custom-select-dropdown';
    dropdown.style.cssText = 'position: absolute; top: 100%; left: 0; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; z-index: 1000; display: none; max-height: 200px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px var(--shadow); min-width: 100px;';
    
    options.forEach(opt => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'custom-select-option';
        optionDiv.style.cssText = 'padding: 6px 12px; cursor: pointer; transition: background 0.1s; font-size: 12px; color: var(--text-primary); white-space: nowrap;';
        optionDiv.textContent = opt.label;
        optionDiv.dataset.value = opt.value;
        
        if (opt.value == selectedValue) {
            optionDiv.style.background = 'var(--badge-bg)';
            optionDiv.style.fontWeight = 'bold';
        }
        
        optionDiv.addEventListener('click', () => {
            trigger.textContent = opt.label;
            dropdown.style.display = 'none';
            if (onSelect) onSelect(opt.value, opt.label);
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
        document.querySelectorAll('.custom-select-dropdown').forEach(d => {
            if (d !== dropdown) d.style.display = 'none';
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

// Создать группу кастомных селекторов для даты (с общей стрелкой)
function createCustomDateGroup(containerId, dayValue, monthValue, yearValue, onDateChange) {
    let container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }
    
    container.innerHTML = '';
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.gap = '2px';
    container.style.backgroundColor = 'transparent';
    container.style.padding = '0';
    container.style.border = 'none';
    container.style.cursor = 'pointer';
    
    // Дни
    const daysOptions = [];
    for (let i = 1; i <= 31; i++) {
        daysOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    const daySelect = createCustomSelect(containerId + '_day', daysOptions, dayValue, (value) => {
        if (onDateChange) onDateChange('day', value);
    });
    
    const sep1 = document.createElement('span');
    sep1.textContent = ' ';
    sep1.style.color = 'var(--text-muted)';
    sep1.style.fontSize = '12px';
    container.appendChild(sep1);
    
    // Месяцы
    const monthNames = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const monthsOptions = [];
    for (let i = 0; i < 12; i++) {
        monthsOptions.push({ value: i + 1, label: monthNames[i] });
    }
    const monthSelect = createCustomSelect(containerId + '_month', monthsOptions, monthValue, (value) => {
        if (onDateChange) onDateChange('month', value);
    });
    
    const sep2 = document.createElement('span');
    sep2.textContent = ' ';
    sep2.style.color = 'var(--text-muted)';
    sep2.style.fontSize = '12px';
    container.appendChild(sep2);
    
    // Годы
    const currentYear = new Date().getFullYear();
    const yearsOptions = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
        yearsOptions.push({ value: i, label: i.toString() });
    }
    const yearSelect = createCustomSelect(containerId + '_year', yearsOptions, yearValue, (value) => {
        if (onDateChange) onDateChange('year', value);
    });
    
    // Общая стрелка для всей группы
    const arrow = document.createElement('span');
    arrow.textContent = ' ▼';
    arrow.style.cssText = 'font-size: 9px; color: var(--text-secondary); margin-left: 2px;';
    container.appendChild(arrow);
    
    // Клик по всей группе открывает выпадайку первого селектора (дней)
    container.addEventListener('click', (e) => {
        if (e.target === container || container.contains(e.target)) {
            const firstTrigger = daySelect?.trigger;
            if (firstTrigger) {
                firstTrigger.click();
            }
        }
    });
}

// Создать группу кастомных селекторов для времени (с общей стрелкой)
function createCustomTimeGroup(containerId, hourValue, minuteValue, onTimeChange) {
    let container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }
    
    container.innerHTML = '';
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.gap = '2px';
    container.style.backgroundColor = 'transparent';
    container.style.padding = '0';
    container.style.border = 'none';
    container.style.cursor = 'pointer';
    
    // Часы
    const hoursOptions = [];
    for (let i = 0; i <= 23; i++) {
        hoursOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    const hourSelect = createCustomSelect(containerId + '_hour', hoursOptions, hourValue, (value) => {
        if (onTimeChange) onTimeChange('hour', value);
    });
    
    const sep = document.createElement('span');
    sep.textContent = ':';
    sep.style.color = 'var(--text-muted)';
    sep.style.fontSize = '12px';
    container.appendChild(sep);
    
    // Минуты
    const minutesOptions = [];
    for (let i = 0; i <= 59; i++) {
        minutesOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    const minuteSelect = createCustomSelect(containerId + '_minute', minutesOptions, minuteValue, (value) => {
        if (onTimeChange) onTimeChange('minute', value);
    });
    
    // Общая стрелка для всей группы
    const arrow = document.createElement('span');
    arrow.textContent = ' ▼';
    arrow.style.cssText = 'font-size: 9px; color: var(--text-secondary); margin-left: 2px;';
    container.appendChild(arrow);
    
    // Клик по всей группе открывает выпадайку первого селектора (часов)
    container.addEventListener('click', (e) => {
        if (e.target === container || container.contains(e.target)) {
            const firstTrigger = hourSelect?.trigger;
            if (firstTrigger) {
                firstTrigger.click();
            }
        }
    });
}

// Инициализация кастомных селекторов для истории
function initCustomDateTimeSelects() {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    createCustomDateGroup('dateFromDateGroup', currentDay, currentMonth, currentYear, (type, value) => {
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomTimeGroup('dateFromTimeGroup', 0, 0, (type, value) => {
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomDateGroup('dateToDateGroup', currentDay, currentMonth, currentYear, (type, value) => {
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomTimeGroup('dateToTimeGroup', 23, 59, (type, value) => {
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
}

// Инициализация для статистики
function initCustomStatsDateTimeSelects() {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    createCustomDateGroup('statsDateFromDateGroup', oneMonthAgo.getDate(), oneMonthAgo.getMonth() + 1, oneMonthAgo.getFullYear(), null);
    createCustomTimeGroup('statsDateFromTimeGroup', 0, 0, null);
    createCustomDateGroup('statsDateToDateGroup', currentDay, currentMonth, currentYear, null);
    createCustomTimeGroup('statsDateToTimeGroup', 23, 59, null);
}

function initCustomGlobalStatsDateTimeSelects() {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    createCustomDateGroup('globalStatsDateFromDateGroup', oneMonthAgo.getDate(), oneMonthAgo.getMonth() + 1, oneMonthAgo.getFullYear(), null);
    createCustomTimeGroup('globalStatsDateFromTimeGroup', 0, 0, null);
    createCustomDateGroup('globalStatsDateToDateGroup', currentDay, currentMonth, currentYear, null);
    createCustomTimeGroup('globalStatsDateToTimeGroup', 23, 59, null);
}
