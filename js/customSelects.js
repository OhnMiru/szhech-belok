// ========== КАСТОМНЫЕ СЕЛЕКТОРЫ ==========

// Создать кастомный селектор (компактный режим)
function createCustomSelect(containerId, options, selectedValue, onSelect, placeholder = '') {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    container.innerHTML = '';
    
    const selectedOption = options.find(opt => opt.value == selectedValue);
    let displayText = selectedOption ? selectedOption.label : (placeholder || options[0]?.label || 'Выберите');
    
    const customSelect = document.createElement('div');
    customSelect.className = 'custom-select';
    customSelect.style.position = 'relative';
    customSelect.style.display = 'inline-block';
    customSelect.style.width = 'auto';
    customSelect.style.minWidth = '60px';
    
    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    trigger.style.cssText = 'background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 30px; padding: 6px 24px 6px 10px; font-size: 12px; cursor: pointer; white-space: nowrap; color: var(--text-primary); position: relative; display: inline-block;';
    trigger.textContent = displayText;
    
    const arrow = document.createElement('span');
    arrow.style.cssText = 'position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 8px; color: var(--text-secondary);';
    arrow.textContent = '▼';
    trigger.appendChild(arrow);
    
    const dropdown = document.createElement('div');
    dropdown.className = 'custom-select-dropdown';
    dropdown.style.cssText = 'position: absolute; top: 100%; left: 0; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; z-index: 1000; display: none; max-height: 250px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px var(--shadow); min-width: 120px;';
    
    options.forEach(opt => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'custom-select-option';
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

// Создать группу кастомных селекторов для даты
function createCustomDateGroup(containerId, dayValue, monthValue, yearValue, onDateChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.gap = '2px';
    
    const daysOptions = [];
    for (let i = 1; i <= 31; i++) {
        daysOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    createCustomSelect(containerId + '_day', daysOptions, dayValue, (value) => {
        if (onDateChange) onDateChange('day', value);
    });
    
    const sep1 = document.createElement('span');
    sep1.textContent = ' ';
    sep1.style.color = 'var(--text-muted)';
    container.appendChild(sep1);
    
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const monthsOptions = [];
    for (let i = 0; i < 12; i++) {
        monthsOptions.push({ value: i + 1, label: monthNames[i] });
    }
    createCustomSelect(containerId + '_month', monthsOptions, monthValue, (value) => {
        if (onDateChange) onDateChange('month', value);
    });
    
    const sep2 = document.createElement('span');
    sep2.textContent = ' ';
    sep2.style.color = 'var(--text-muted)';
    container.appendChild(sep2);
    
    const currentYear = new Date().getFullYear();
    const yearsOptions = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
        yearsOptions.push({ value: i, label: i.toString() });
    }
    createCustomSelect(containerId + '_year', yearsOptions, yearValue, (value) => {
        if (onDateChange) onDateChange('year', value);
    });
}

// Создать группу кастомных селекторов для времени
function createCustomTimeGroup(containerId, hourValue, minuteValue, onTimeChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.gap = '2px';
    
    const hoursOptions = [];
    for (let i = 0; i <= 23; i++) {
        hoursOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    createCustomSelect(containerId + '_hour', hoursOptions, hourValue, (value) => {
        if (onTimeChange) onTimeChange('hour', value);
    });
    
    const sep = document.createElement('span');
    sep.textContent = ':';
    sep.style.color = 'var(--text-muted)';
    container.appendChild(sep);
    
    const minutesOptions = [];
    for (let i = 0; i <= 59; i++) {
        minutesOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    createCustomSelect(containerId + '_minute', minutesOptions, minuteValue, (value) => {
        if (onTimeChange) onTimeChange('minute', value);
    });
}

// Инициализация кастомных селекторов для истории
function initCustomDateTimeSelects() {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    createCustomDateGroup('dateFromDateGroup', currentDay, currentMonth, currentYear, (type, value) => {
        const hiddenSelect = document.getElementById('dateFrom' + (type === 'day' ? 'Day' : type === 'month' ? 'Month' : 'Year'));
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomTimeGroup('dateFromTimeGroup', 0, 0, (type, value) => {
        const hiddenSelect = document.getElementById(type === 'hour' ? 'timeFromHour' : 'timeFromMinute');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomDateGroup('dateToDateGroup', currentDay, currentMonth, currentYear, (type, value) => {
        const hiddenSelect = document.getElementById('dateTo' + (type === 'day' ? 'Day' : type === 'month' ? 'Month' : 'Year'));
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomTimeGroup('dateToTimeGroup', 23, 59, (type, value) => {
        const hiddenSelect = document.getElementById(type === 'hour' ? 'timeToHour' : 'timeToMinute');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
}

// Инициализация кастомных селекторов для статистики
function initCustomStatsDateTimeSelects() {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    createCustomDateGroup('statsDateFromDateGroup', oneMonthAgo.getDate(), oneMonthAgo.getMonth() + 1, oneMonthAgo.getFullYear(), (type, value) => {
        const hiddenSelect = document.getElementById('statsDateFrom' + (type === 'day' ? 'Day' : type === 'month' ? 'Month' : 'Year'));
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderStats === 'function') renderStats();
    });
    createCustomTimeGroup('statsDateFromTimeGroup', 0, 0, (type, value) => {
        const hiddenSelect = document.getElementById(type === 'hour' ? 'statsTimeFromHour' : 'statsTimeFromMinute');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderStats === 'function') renderStats();
    });
    
    createCustomDateGroup('statsDateToDateGroup', currentDay, currentMonth, currentYear, (type, value) => {
        const hiddenSelect = document.getElementById('statsDateTo' + (type === 'day' ? 'Day' : type === 'month' ? 'Month' : 'Year'));
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderStats === 'function') renderStats();
    });
    createCustomTimeGroup('statsDateToTimeGroup', 23, 59, (type, value) => {
        const hiddenSelect = document.getElementById(type === 'hour' ? 'statsTimeToHour' : 'statsTimeToMinute');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderStats === 'function') renderStats();
    });
}

// Инициализация кастомных селекторов для глобальной статистики
function initCustomGlobalStatsDateTimeSelects() {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    createCustomDateGroup('globalStatsDateFromDateGroup', oneMonthAgo.getDate(), oneMonthAgo.getMonth() + 1, oneMonthAgo.getFullYear(), (type, value) => {
        const hiddenSelect = document.getElementById('globalStatsDateFrom' + (type === 'day' ? 'Day' : type === 'month' ? 'Month' : 'Year'));
        if (hiddenSelect) hiddenSelect.value = value;
    });
    createCustomTimeGroup('globalStatsDateFromTimeGroup', 0, 0, (type, value) => {
        const hiddenSelect = document.getElementById(type === 'hour' ? 'globalStatsTimeFromHour' : 'globalStatsTimeFromMinute');
        if (hiddenSelect) hiddenSelect.value = value;
    });
    
    createCustomDateGroup('globalStatsDateToDateGroup', currentDay, currentMonth, currentYear, (type, value) => {
        const hiddenSelect = document.getElementById('globalStatsDateTo' + (type === 'day' ? 'Day' : type === 'month' ? 'Month' : 'Year'));
        if (hiddenSelect) hiddenSelect.value = value;
    });
    createCustomTimeGroup('globalStatsDateToTimeGroup', 23, 59, (type, value) => {
        const hiddenSelect = document.getElementById(type === 'hour' ? 'globalStatsTimeToHour' : 'globalStatsTimeToMinute');
        if (hiddenSelect) hiddenSelect.value = value;
    });
}
