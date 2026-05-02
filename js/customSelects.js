// ========== КАСТОМНЫЕ СЕЛЕКТОРЫ ==========

// Создать кастомный селектор (компактный режим)
function createCustomSelect(containerId, options, selectedValue, onSelect, placeholder = '') {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Определяем отображаемый текст
    const selectedOption = options.find(opt => opt.value == selectedValue);
    let displayText = selectedOption ? selectedOption.label : (placeholder || options[0]?.label || 'Выберите');
    
    // Создаём структуру кастомного селектора
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
    
    // Добавляем стрелку
    const arrow = document.createElement('span');
    arrow.style.cssText = 'position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 8px; color: var(--text-secondary);';
    arrow.textContent = '▼';
    trigger.appendChild(arrow);
    
    const dropdown = document.createElement('div');
    dropdown.className = 'custom-select-dropdown';
    dropdown.style.cssText = 'position: absolute; top: 100%; left: 0; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; z-index: 1000; display: none; max-height: 250px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px var(--shadow); min-width: 120px;';
    
    // Добавляем опции
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
    
    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.style.display === 'block';
        // Закрываем все другие открытые дропдауны
        document.querySelectorAll('.custom-select-dropdown').forEach(d => {
            if (d !== dropdown) d.style.display = 'none';
        });
        dropdown.style.display = isOpen ? 'none' : 'block';
    });
    
    customSelect.appendChild(trigger);
    customSelect.appendChild(dropdown);
    container.appendChild(customSelect);
    
    // Закрытие при клике вне
    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    
    return { trigger, dropdown, customSelect };
}

// Создать группу кастомных селекторов для даты (день, месяц, год)
function createCustomDateGroup(containerId, dayValue, monthValue, yearValue, onDateChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '4px';
    
    // Дни
    const daysOptions = [];
    for (let i = 1; i <= 31; i++) {
        daysOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    
    const daySelect = createCustomSelect(containerId + '_day', daysOptions, dayValue, (value) => {
        if (onDateChange) onDateChange('day', value);
    });
    
    // Разделитель
    const sep1 = document.createElement('span');
    sep1.textContent = ' ';
    sep1.style.color = 'var(--text-muted)';
    container.appendChild(sep1);
    
    // Месяцы
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const monthsOptions = [];
    for (let i = 0; i < 12; i++) {
        monthsOptions.push({ value: i + 1, label: monthNames[i] });
    }
    
    const monthSelect = createCustomSelect(containerId + '_month', monthsOptions, monthValue, (value) => {
        if (onDateChange) onDateChange('month', value);
    });
    
    // Разделитель
    const sep2 = document.createElement('span');
    sep2.textContent = ' ';
    sep2.style.color = 'var(--text-muted)';
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
}

// Создать группу кастомных селекторов для времени (час, минута)
function createCustomTimeGroup(containerId, hourValue, minuteValue, onTimeChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '4px';
    
    // Часы
    const hoursOptions = [];
    for (let i = 0; i <= 23; i++) {
        hoursOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    
    const hourSelect = createCustomSelect(containerId + '_hour', hoursOptions, hourValue, (value) => {
        if (onTimeChange) onTimeChange('hour', value);
    });
    
    // Разделитель
    const sep = document.createElement('span');
    sep.textContent = ':';
    sep.style.color = 'var(--text-muted)';
    container.appendChild(sep);
    
    // Минуты
    const minutesOptions = [];
    for (let i = 0; i <= 59; i++) {
        minutesOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    
    const minuteSelect = createCustomSelect(containerId + '_minute', minutesOptions, minuteValue, (value) => {
        if (onTimeChange) onTimeChange('minute', value);
    });
}

// Инициализация кастомных селекторов для истории
function initCustomDateTimeSelects() {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Группа "от" (дата)
    createCustomDateGroup('dateFromDateGroup', currentDay, currentMonth, currentYear, (type, value) => {
        const hiddenSelect = document.getElementById('dateFrom' + (type === 'day' ? 'Day' : type === 'month' ? 'Month' : 'Year'));
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    // Группа "от" (время)
    createCustomTimeGroup('dateFromTimeGroup', 0, 0, (type, value) => {
        const hiddenSelect = document.getElementById(type === 'hour' ? 'timeFromHour' : 'timeFromMinute');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    // Группа "до" (дата)
    createCustomDateGroup('dateToDateGroup', currentDay, currentMonth, currentYear, (type, value) => {
        const hiddenSelect = document.getElementById('dateTo' + (type === 'day' ? 'Day' : type === 'month' ? 'Month' : 'Year'));
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    // Группа "до" (время)
    createCustomTimeGroup('dateToTimeGroup', 23, 59, (type, value) => {
        const hiddenSelect = document.getElementById(type === 'hour' ? 'timeToHour' : 'timeToMinute');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
}
