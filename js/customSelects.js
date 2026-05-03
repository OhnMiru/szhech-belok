// ========== КАСТОМНЫЕ СЕЛЕКТОРЫ ==========

// Создать кастомный селектор
function createCustomSelect(containerId, options, selectedValue, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    container.innerHTML = '';
    
    const selectedOption = options.find(opt => opt.value == selectedValue);
    let displayText = selectedOption ? selectedOption.label : options[0]?.label || 'Выберите';
    
    const customSelect = document.createElement('div');
    customSelect.className = 'custom-select-flat';
    customSelect.style.position = 'relative';
    customSelect.style.display = 'inline-block';
    
    const trigger = document.createElement('div');
    trigger.className = 'custom-select-flat-trigger';
    trigger.style.cssText = 'padding: 4px 14px 4px 0; font-size: 12px; cursor: pointer; white-space: nowrap; color: var(--text-primary); display: inline-block; font-family: monospace;';
    trigger.textContent = displayText;
    
    const arrow = document.createElement('span');
    arrow.style.cssText = 'position: absolute; right: 0; top: 50%; transform: translateY(-50%); font-size: 9px; color: var(--text-secondary);';
    arrow.textContent = '▼';
    trigger.appendChild(arrow);
    
    const dropdown = document.createElement('div');
    dropdown.className = 'custom-select-flat-dropdown';
    dropdown.style.cssText = 'position: absolute; top: 100%; left: 0; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; z-index: 1000; display: none; max-height: 200px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px var(--shadow); min-width: 100px;';
    
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
        document.querySelectorAll('.custom-select-flat-dropdown').forEach(d => {
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

// Инициализация кастомных селекторов для истории
function initCustomDateTimeSelects() {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const monthNames = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    
    // Дни
    const daysOptions = [];
    for (let i = 1; i <= 31; i++) {
        daysOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    
    // Месяцы
    const monthsOptions = [];
    for (let i = 0; i < 12; i++) {
        monthsOptions.push({ value: i + 1, label: monthNames[i] });
    }
    
    // Годы
    const currentYearNum = new Date().getFullYear();
    const yearsOptions = [];
    for (let i = currentYearNum - 2; i <= currentYearNum + 2; i++) {
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
    
    // Создаём селекторы
    createCustomSelect('dateFromDayCustom', daysOptions, currentDay, (value) => {
        document.getElementById('dateFromDay').value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomSelect('dateFromMonthCustom', monthsOptions, currentMonth, (value) => {
        document.getElementById('dateFromMonth').value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomSelect('dateFromYearCustom', yearsOptions, currentYear, (value) => {
        document.getElementById('dateFromYear').value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomSelect('timeFromHourCustom', hoursOptions, 0, (value) => {
        document.getElementById('timeFromHour').value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomSelect('timeFromMinuteCustom', minutesOptions, 0, (value) => {
        document.getElementById('timeFromMinute').value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomSelect('dateToDayCustom', daysOptions, currentDay, (value) => {
        document.getElementById('dateToDay').value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomSelect('dateToMonthCustom', monthsOptions, currentMonth, (value) => {
        document.getElementById('dateToMonth').value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomSelect('dateToYearCustom', yearsOptions, currentYear, (value) => {
        document.getElementById('dateToYear').value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomSelect('timeToHourCustom', hoursOptions, 23, (value) => {
        document.getElementById('timeToHour').value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    createCustomSelect('timeToMinuteCustom', minutesOptions, 59, (value) => {
        document.getElementById('timeToMinute').value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
}
