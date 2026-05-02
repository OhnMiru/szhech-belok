// ========== КАСТОМНЫЕ СЕЛЕКТОРЫ ==========

// Создать кастомный селектор
function createCustomSelect(containerId, options, selectedValue, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Создаём структуру кастомного селектора
    const customSelect = document.createElement('div');
    customSelect.className = 'custom-select';
    customSelect.style.position = 'relative';
    customSelect.style.width = '100%';
    
    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    trigger.style.cssText = 'background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 30px; padding: 8px 28px 8px 12px; font-size: 13px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary); position: relative;';
    
    // Находим отображаемый текст для выбранного значения
    const selectedOption = options.find(opt => opt.value == selectedValue);
    trigger.textContent = selectedOption ? selectedOption.label : options[0]?.label || 'Выберите';
    
    // Добавляем стрелку
    const arrow = document.createElement('span');
    arrow.style.cssText = 'position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 8px; color: var(--text-secondary);';
    arrow.textContent = '▼';
    trigger.appendChild(arrow);
    
    const dropdown = document.createElement('div');
    dropdown.className = 'custom-select-dropdown';
    dropdown.style.cssText = 'position: absolute; top: 100%; left: 0; right: 0; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; z-index: 1000; display: none; max-height: 250px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px var(--shadow);';
    
    // Добавляем опции
    options.forEach(opt => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'custom-select-option';
        optionDiv.style.cssText = 'padding: 10px 12px; cursor: pointer; transition: background 0.1s; font-size: 13px; color: var(--text-primary);';
        optionDiv.textContent = opt.label;
        optionDiv.dataset.value = opt.value;
        
        if (opt.value == selectedValue) {
            optionDiv.style.background = 'var(--badge-bg)';
            optionDiv.style.fontWeight = 'bold';
        }
        
        optionDiv.addEventListener('click', () => {
            trigger.textContent = opt.label;
            trigger.appendChild(arrow);
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

// Обновить значение кастомного селектора
function updateCustomSelectValue(containerId, value, options) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const trigger = container.querySelector('.custom-select-trigger');
    const dropdown = container.querySelector('.custom-select-dropdown');
    if (!trigger || !dropdown) return;
    
    const selectedOption = options.find(opt => opt.value == value);
    if (selectedOption) {
        // Обновляем текст триггера
        trigger.childNodes[0].textContent = selectedOption.label;
        // Обновляем стили опций
        dropdown.querySelectorAll('.custom-select-option').forEach(opt => {
            if (opt.dataset.value == value) {
                opt.style.background = 'var(--badge-bg)';
                opt.style.fontWeight = 'bold';
            } else {
                opt.style.background = '';
                opt.style.fontWeight = 'normal';
            }
        });
    }
}

// Инициализация кастомных селекторов для истории
function initCustomDateTimeSelects() {
    // Дни
    const daysOptions = [];
    for (let i = 1; i <= 31; i++) {
        daysOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    
    // Месяцы
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const monthsOptions = [];
    for (let i = 0; i < 12; i++) {
        monthsOptions.push({ value: i + 1, label: monthNames[i] });
    }
    
    // Годы
    const currentYear = new Date().getFullYear();
    const yearsOptions = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
        yearsOptions.push({ value: i, label: i.toString() });
    }
    
    // Часы
    const hoursOptions = [];
    for (let i = 0; i <= 23; i++) {
        hoursOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    
    // Минуты
    const minutesOptions = [];
    for (let i = 0; i <= 59; i++) {
        minutesOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    
    // Создаём селекторы для истории
    createCustomSelect('dateFromDayContainer', daysOptions, 1, (value, label) => {
        document.getElementById('dateFromDay') ? document.getElementById('dateFromDay').value = value : null;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomSelect('dateFromMonthContainer', monthsOptions, new Date().getMonth() + 1, (value, label) => {
        document.getElementById('dateFromMonth') ? document.getElementById('dateFromMonth').value = value : null;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomSelect('dateFromYearContainer', yearsOptions, currentYear, (value, label) => {
        document.getElementById('dateFromYear') ? document.getElementById('dateFromYear').value = value : null;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomSelect('timeFromHourContainer', hoursOptions, 0, (value, label) => {
        document.getElementById('timeFromHour') ? document.getElementById('timeFromHour').value = value : null;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomSelect('timeFromMinuteContainer', minutesOptions, 0, (value, label) => {
        document.getElementById('timeFromMinute') ? document.getElementById('timeFromMinute').value = value : null;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomSelect('dateToDayContainer', daysOptions, new Date().getDate(), (value, label) => {
        document.getElementById('dateToDay') ? document.getElementById('dateToDay').value = value : null;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomSelect('dateToMonthContainer', monthsOptions, new Date().getMonth() + 1, (value, label) => {
        document.getElementById('dateToMonth') ? document.getElementById('dateToMonth').value = value : null;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomSelect('dateToYearContainer', yearsOptions, currentYear, (value, label) => {
        document.getElementById('dateToYear') ? document.getElementById('dateToYear').value = value : null;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomSelect('timeToHourContainer', hoursOptions, 23, (value, label) => {
        document.getElementById('timeToHour') ? document.getElementById('timeToHour').value = value : null;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomSelect('timeToMinuteContainer', minutesOptions, 59, (value, label) => {
        document.getElementById('timeToMinute') ? document.getElementById('timeToMinute').value = value : null;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
}
