// ========== СТАТИСТИКА ==========

// Переменные для фильтра по времени
let statsFilterFromDate = null;
let statsFilterToDate = null;
let statsFilterActive = false;

// Переменные для фильтра по характеристикам
let statsSelectedType = "";
let statsSelectedValues = []; // массив выбранных значений характеристики
let statsAttributeFilterActive = false;

// Кэш для данных статистики по характеристикам
let attributeStatsCache = null;

function openStatsModal() {
    const modal = document.getElementById('statsModal');
    if (modal) {
        if (typeof initStatsDateTimeSelects === 'function') {
            initStatsDateTimeSelects();
        }
        renderStats();
        modal.style.display = 'block';
    }
}

function closeStatsModal() { 
    const modal = document.getElementById('statsModal'); 
    if (modal) modal.style.display = 'none'; 
}

// ========== ФИЛЬТРЫ ПО ХАРАКТЕРИСТИКАМ ==========

// Инициализация селектора типов в статистике
function initStatsTypeSelector() {
    const container = document.getElementById('statsAttributeFilters');
    if (!container) return;
    
    const types = getAllMerchTypes();
    let html = `
        <div class="stats-attribute-filters" style="background: var(--badge-bg); border-radius: 16px; padding: 12px; margin-bottom: 16px;">
            <div style="font-weight: bold; margin-bottom: 8px; color: var(--badge-text);">🔍 Фильтр по характеристикам</div>
            <div class="filter-row" style="margin-bottom: 8px;">
                <select id="statsTypeSelect" class="edit-input" style="flex: 1;" onchange="onStatsTypeChange()">
                    <option value="">Все типы</option>
    `;
    for (const type of types) {
        html += `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`;
    }
    html += `
                </select>
            </div>
            <div id="statsValueCheckboxesContainer" style="display: none; margin-bottom: 8px;"></div>
            <div id="statsAttributeFilterButtons" style="display: none; display: flex; gap: 8px; margin-top: 8px;">
                <button class="edit-save-btn" onclick="applyStatsAttributeFilter()" style="padding: 6px 16px;">Применить</button>
                <button class="edit-cancel-btn" onclick="resetStatsAttributeFilter()" style="padding: 6px 16px;">Сбросить</button>
            </div>
        </div>
    `;
    
    // Вставляем фильтры после блока с фильтром по времени
    const filterBlock = document.getElementById('statsFilterBlock');
    if (filterBlock) {
        let attrContainer = document.getElementById('statsAttributeFilters');
        if (!attrContainer) {
            filterBlock.insertAdjacentHTML('afterend', html);
        }
    }
}

// Обработчик смены типа в статистике
function onStatsTypeChange() {
    const typeSelect = document.getElementById('statsTypeSelect');
    const selectedType = typeSelect?.value || "";
    
    statsSelectedType = selectedType;
    
    const valueContainer = document.getElementById('statsValueCheckboxesContainer');
    const buttonsContainer = document.getElementById('statsAttributeFilterButtons');
    
    if (!selectedType) {
        if (valueContainer) valueContainer.style.display = 'none';
        if (buttonsContainer) buttonsContainer.style.display = 'none';
        statsSelectedValues = [];
        return;
    }
    
    const typeConfig = getTypeConfigFromCache(selectedType);
    if (!typeConfig) {
        if (valueContainer) valueContainer.style.display = 'none';
        if (buttonsContainer) buttonsContainer.style.display = 'none';
        return;
    }
    
    // Собираем все уникальные значения характеристик для выбранного типа
    const allValues = new Set();
    
    // Проходим по всем товарам и собираем значения атрибутов для выбранного типа
    for (const card of originalCardsData) {
        if (card.type === selectedType) {
            if (card.attribute1 && card.attribute1.trim()) {
                allValues.add(card.attribute1.trim());
            }
            if (card.attribute2 && card.attribute2.trim()) {
                allValues.add(card.attribute2.trim());
            }
        }
    }
    
    const values = Array.from(allValues).sort();
    
    if (values.length === 0) {
        if (valueContainer) valueContainer.style.display = 'none';
        if (buttonsContainer) buttonsContainer.style.display = 'none';
        return;
    }
    
    if (buttonsContainer) buttonsContainer.style.display = 'flex';
    
    // Создаём чекбоксы для значений характеристик
    let valuesHtml = `<div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Выберите характеристики:</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">`;
    
    // Добавляем чекбокс "Все"
    const allChecked = statsSelectedValues.length === 0 || statsSelectedValues.length === values.length;
    valuesHtml += `<label style="display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 12px;">
        <input type="checkbox" class="stats-value-checkbox" data-value="__all__" ${allChecked ? 'checked' : ''} onchange="onStatsValueChange('__all__', this.checked)"> 
        Все
    </label>`;
    
    for (const value of values) {
        const isChecked = statsSelectedValues.includes(value) || allChecked;
        valuesHtml += `<label style="display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 12px;">
            <input type="checkbox" class="stats-value-checkbox" data-value="${escapeHtml(value)}" ${isChecked ? 'checked' : ''} onchange="onStatsValueChange('${escapeHtml(value).replace(/'/g, "\\'")}', this.checked)"> 
            ${escapeHtml(value)}
        </label>`;
    }
    
    valuesHtml += `</div>`;
    if (valueContainer) {
        valueContainer.innerHTML = valuesHtml;
        valueContainer.style.display = 'block';
    }
}

// Обработчик выбора значения
function onStatsValueChange(value, isChecked) {
    if (value === '__all__') {
        // Если выбрали "Все", очищаем массив
        statsSelectedValues = [];
        // Обновляем все чекбоксы
        document.querySelectorAll('.stats-value-checkbox').forEach(cb => {
            if (cb.dataset.value !== '__all__') {
                cb.checked = isChecked;
            }
        });
    } else {
        if (isChecked) {
            if (!statsSelectedValues.includes(value)) {
                statsSelectedValues.push(value);
            }
            // Снимаем галочку с "Все", если она была
            const allCheckbox = document.querySelector('.stats-value-checkbox[data-value="__all__"]');
            if (allCheckbox) allCheckbox.checked = false;
        } else {
            statsSelectedValues = statsSelectedValues.filter(v => v !== value);
            // Если после удаления массив пустой, отмечаем "Все"
            if (statsSelectedValues.length === 0) {
                const allCheckbox = document.querySelector('.stats-value-checkbox[data-value="__all__"]');
                if (allCheckbox) allCheckbox.checked = true;
            }
        }
    }
}

// Применение фильтра по характеристикам
function applyStatsAttributeFilter() {
    const typeSelect = document.getElementById('statsTypeSelect');
    statsSelectedType = typeSelect?.value || "";
    
    statsAttributeFilterActive = !!(statsSelectedType && statsSelectedValues.length > 0);
    
    renderStats();
}

// Сброс фильтра по характеристикам
function resetStatsAttributeFilter() {
    const typeSelect = document.getElementById('statsTypeSelect');
    if (typeSelect) typeSelect.value = "";
    
    statsSelectedType = "";
    statsSelectedValues = [];
    statsAttributeFilterActive = false;
    
    // Скрываем дополнительные контейнеры
    const valueContainer = document.getElementById('statsValueCheckboxesContainer');
    const buttonsContainer = document.getElementById('statsAttributeFilterButtons');
    if (valueContainer) valueContainer.style.display = 'none';
    if (buttonsContainer) buttonsContainer.style.display = 'none';
    
    renderStats();
}

// Фильтрация продаж по характеристикам
function filterSalesByAttributes(sales) {
    if (!statsAttributeFilterActive || !statsSelectedType || statsSelectedValues.length === 0) {
        return sales;
    }
    
    const filtered = [];
    for (const sale of sales) {
        let hasMatchingItem = false;
        for (const item of sale.items) {
            const card = originalCardsData.find(c => c.id === item.id);
            if (!card) continue;
            
            // Проверяем тип
            if (card.type !== statsSelectedType) continue;
            
            // Проверяем значения характеристик (атрибутов)
            const attr1 = card.attribute1 || "";
            const attr2 = card.attribute2 || "";
            
            if (statsSelectedValues.includes(attr1) || statsSelectedValues.includes(attr2)) {
                hasMatchingItem = true;
                break;
            }
        }
        if (hasMatchingItem) {
            filtered.push(sale);
        }
    }
    return filtered;
}

// ========== КАСТОМНЫЕ СЕЛЕКТОРЫ ДЛЯ ДАТЫ/ВРЕМЕНИ В СТАТИСТИКЕ ==========

function initCustomStatsDateTimeSelects() {
    // Инициализация кастомных селекторов для даты "от"
    initStatsCustomDateGroup('statsDateFrom');
    // Инициализация кастомных селекторов для даты "до"
    initStatsCustomDateGroup('statsDateTo');
}

function initStatsCustomDateGroup(prefix) {
    const container = document.getElementById(`${prefix}Container`);
    if (!container) return;
    
    // Очищаем контейнер
    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '6px';
    container.style.flexWrap = 'wrap';
    
    // Получаем текущие значения из скрытых select (или дефолтные)
    let dayValue = document.getElementById(`${prefix}Day`)?.value || new Date().getDate();
    let monthValue = document.getElementById(`${prefix}Month`)?.value || (new Date().getMonth() + 1);
    let yearValue = document.getElementById(`${prefix}Year`)?.value || new Date().getFullYear();
    let hourValue = document.getElementById(`statsTime${prefix === 'statsDateFrom' ? 'From' : 'To'}Hour`)?.value || (prefix === 'statsDateFrom' ? 0 : 23);
    let minuteValue = document.getElementById(`statsTime${prefix === 'statsDateFrom' ? 'From' : 'To'}Minute`)?.value || (prefix === 'statsDateFrom' ? 0 : 59);
    
    // Создаём группу для даты
    const dateGroup = document.createElement('div');
    dateGroup.style.display = 'inline-flex';
    dateGroup.style.alignItems = 'center';
    dateGroup.style.gap = '4px';
    dateGroup.style.background = 'var(--card-bg)';
    dateGroup.style.border = '1px solid var(--border-color)';
    dateGroup.style.borderRadius = '30px';
    dateGroup.style.padding = '4px 12px';
    
    // День
    const dayOptions = [];
    for (let i = 1; i <= 31; i++) {
        dayOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    createCustomSelectForStats(`${prefix}_day`, dayOptions, dayValue, (value) => {
        const hiddenSelect = document.getElementById(`${prefix}Day`);
        if (hiddenSelect) hiddenSelect.value = value;
    });
    
    dateGroup.appendChild(document.createTextNode(' '));
    
    // Месяц
    const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const monthOptions = [];
    for (let i = 0; i < 12; i++) {
        monthOptions.push({ value: i + 1, label: monthNames[i] });
    }
    createCustomSelectForStats(`${prefix}_month`, monthOptions, monthValue, (value) => {
        const hiddenSelect = document.getElementById(`${prefix}Month`);
        if (hiddenSelect) hiddenSelect.value = value;
    });
    
    dateGroup.appendChild(document.createTextNode(' '));
    
    // Год
    const currentYear = new Date().getFullYear();
    const yearOptions = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
        yearOptions.push({ value: i, label: i.toString() });
    }
    createCustomSelectForStats(`${prefix}_year`, yearOptions, yearValue, (value) => {
        const hiddenSelect = document.getElementById(`${prefix}Year`);
        if (hiddenSelect) hiddenSelect.value = value;
    });
    
    // Создаём группу для времени
    const timeGroup = document.createElement('div');
    timeGroup.style.display = 'inline-flex';
    timeGroup.style.alignItems = 'center';
    timeGroup.style.gap = '4px';
    timeGroup.style.marginLeft = '8px';
    
    // Часы
    const hourOptions = [];
    for (let i = 0; i <= 23; i++) {
        hourOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    createCustomSelectForStats(`statsTime${prefix === 'statsDateFrom' ? 'From' : 'To'}_hour`, hourOptions, hourValue, (value) => {
        const hiddenSelect = document.getElementById(`statsTime${prefix === 'statsDateFrom' ? 'From' : 'To'}Hour`);
        if (hiddenSelect) hiddenSelect.value = value;
    });
    
    timeGroup.appendChild(document.createTextNode(':'));
    
    // Минуты
    const minuteOptions = [];
    for (let i = 0; i <= 59; i++) {
        minuteOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    createCustomSelectForStats(`statsTime${prefix === 'statsDateFrom' ? 'From' : 'To'}_minute`, minuteOptions, minuteValue, (value) => {
        const hiddenSelect = document.getElementById(`statsTime${prefix === 'statsDateFrom' ? 'From' : 'To'}Minute`);
        if (hiddenSelect) hiddenSelect.value = value;
    });
    
    const wrapper = document.createElement('div');
    wrapper.style.display = 'inline-flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '6px';
    wrapper.appendChild(dateGroup);
    wrapper.appendChild(timeGroup);
    
    container.appendChild(wrapper);
}

function createCustomSelectForStats(selectId, options, selectedValue, onSelect) {
    let container = document.getElementById(selectId);
    if (!container) {
        container = document.createElement('div');
        container.id = selectId;
        container.style.display = 'inline-block';
        document.body.appendChild(container);
    }
    
    container.innerHTML = '';
    
    const selectedOption = options.find(opt => opt.value == selectedValue);
    let displayText = selectedOption ? selectedOption.label : options[0]?.label || 'Выберите';
    
    const customSelect = document.createElement('div');
    customSelect.style.position = 'relative';
    customSelect.style.display = 'inline-block';
    
    const trigger = document.createElement('div');
    trigger.style.cssText = 'background: var(--badge-bg); border: none; border-radius: 16px; padding: 4px 20px 4px 8px; font-size: 11px; cursor: pointer; white-space: nowrap; color: var(--text-primary); display: inline-block; font-family: monospace; min-width: 40px; text-align: center;';
    trigger.textContent = displayText;
    
    const arrow = document.createElement('span');
    arrow.style.cssText = 'position: absolute; right: 6px; top: 50%; transform: translateY(-50%); font-size: 8px; color: var(--text-secondary);';
    arrow.textContent = '▼';
    trigger.appendChild(arrow);
    
    const dropdown = document.createElement('div');
    dropdown.style.cssText = 'position: absolute; top: 100%; left: 0; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; z-index: 1100; display: none; max-height: 150px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px var(--shadow); min-width: 50px;';
    
    options.forEach(opt => {
        const optionDiv = document.createElement('div');
        optionDiv.style.cssText = 'padding: 6px 10px; cursor: pointer; transition: background 0.1s; font-size: 11px; color: var(--text-primary); white-space: nowrap;';
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
        document.querySelectorAll('.stats-custom-dropdown').forEach(d => {
            if (d !== dropdown) d.style.display = 'none';
        });
        dropdown.style.display = isOpen ? 'none' : 'block';
    });
    
    customSelect.appendChild(trigger);
    customSelect.appendChild(dropdown);
    container.appendChild(customSelect);
    
    // Закрытие при клике вне
    const closeHandler = (e) => {
        if (!customSelect.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    };
    document.removeEventListener('click', closeHandler);
    document.addEventListener('click', closeHandler);
    
    return { trigger, dropdown, customSelect };
}

// ========== ОСТАЛЬНЫЕ ФУНКЦИИ СТАТИСТИКИ ==========

// Инициализация селектов даты и времени для статистики
function initStatsDateTimeSelects() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) years.push(i);
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    
    // Заполняем скрытые select (для хранения значений)
    ['statsDateFromDay', 'statsDateToDay'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '';
            for (let i = 1; i <= 31; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i.toString().padStart(2, '0');
                select.appendChild(option);
            }
        }
    });
    
    ['statsDateFromMonth', 'statsDateToMonth'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '';
            for (let i = 0; i < 12; i++) {
                const option = document.createElement('option');
                option.value = i + 1;
                option.textContent = monthNames[i];
                select.appendChild(option);
            }
        }
    });
    
    ['statsDateFromYear', 'statsDateToYear'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '';
            for (const year of years) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                select.appendChild(option);
            }
            if (select.id.includes('To')) {
                select.value = currentYear;
            } else {
                select.value = currentYear - 1;
            }
        }
    });
    
    ['statsTimeFromHour', 'statsTimeToHour'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '';
            for (let i = 0; i <= 23; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i.toString().padStart(2, '0');
                select.appendChild(option);
            }
            if (select.id.includes('From')) {
                select.value = 0;
            } else {
                select.value = 23;
            }
        }
    });
    
    ['statsTimeFromMinute', 'statsTimeToMinute'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '';
            for (let i = 0; i <= 59; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i.toString().padStart(2, '0');
                select.appendChild(option);
            }
            if (select.id.includes('From')) {
                select.value = 0;
            } else {
                select.value = 59;
            }
        }
    });
    
    // Инициализируем кастомные селекторы для даты/времени
    if (typeof initCustomStatsDateTimeSelects === 'function') {
        initCustomStatsDateTimeSelects();
    }
    
    // Инициализируем фильтры по характеристикам
    initStatsTypeSelector();
}

function getStatsDateTimeFromSelects(prefix) {
    const day = document.getElementById(`${prefix}Day`)?.value;
    const month = document.getElementById(`${prefix}Month`)?.value;
    const year = document.getElementById(`${prefix}Year`)?.value;
    const hour = document.getElementById(`statsTime${prefix === 'statsDateFrom' ? 'From' : 'To'}Hour`)?.value;
    const minute = document.getElementById(`statsTime${prefix === 'statsDateFrom' ? 'From' : 'To'}Minute`)?.value;
    
    if (day && month && year && hour && minute) {
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    }
    return null;
}

function toggleStatsFilter() {
    const block = document.getElementById('statsFilterBlock');
    if (block) {
        const isVisible = block.style.display !== 'none';
        block.style.display = isVisible ? 'none' : 'block';
        // При открытии пересоздаём кастомные селекторы
        if (!isVisible && typeof initCustomStatsDateTimeSelects === 'function') {
            setTimeout(() => initCustomStatsDateTimeSelects(), 10);
        }
    }
}

function resetStatsFilter() {
    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - 30);
    
    setStatsDateTimeValues('statsDateFrom', fromDate);
    setStatsDateTimeValues('statsDateTo', now);
    
    statsFilterFromDate = null;
    statsFilterToDate = null;
    statsFilterActive = false;
    
    renderStats();
}

function setStatsDateTimeValues(prefix, date) {
    if (!date) return;
    const day = document.getElementById(`${prefix}Day`);
    const month = document.getElementById(`${prefix}Month`);
    const year = document.getElementById(`${prefix}Year`);
    const hour = document.getElementById(`statsTime${prefix === 'statsDateFrom' ? 'From' : 'To'}Hour`);
    const minute = document.getElementById(`statsTime${prefix === 'statsDateFrom' ? 'From' : 'To'}Minute`);
    
    if (day) day.value = date.getDate();
    if (month) month.value = date.getMonth() + 1;
    if (year) year.value = date.getFullYear();
    if (hour) hour.value = date.getHours();
    if (minute) minute.value = date.getMinutes();
}

function applyStatsFilter() {
    statsFilterFromDate = getStatsDateTimeFromSelects('statsDateFrom');
    statsFilterToDate = getStatsDateTimeFromSelects('statsDateTo');
    statsFilterActive = true;
    renderStats();
}

function getFilteredSalesHistory() {
    let filteredSales = salesHistory.filter(entry => !entry.isReturn && !entry.hidden);
    
    if (statsFilterActive && statsFilterFromDate) {
        filteredSales = filteredSales.filter(entry => new Date(entry.date) >= statsFilterFromDate);
    }
    if (statsFilterActive && statsFilterToDate) {
        filteredSales = filteredSales.filter(entry => new Date(entry.date) <= statsFilterToDate);
    }
    
    // Применяем фильтр по характеристикам
    filteredSales = filterSalesByAttributes(filteredSales);
    
    return filteredSales;
}

// Функция для получения цвета характеристики (такой же как у типа)
function getAttributeColor(attribute) {
    // Используем цветовую палитру типов
    if (!window.attributeColorCache) window.attributeColorCache = new Map();
    if (!window.attributeColorCache.has(attribute)) {
        const index = window.attributeColorCache.size % colorPalette.length;
        window.attributeColorCache.set(attribute, colorPalette[index]);
    }
    return window.attributeColorCache.get(attribute);
}

function renderStats() {
    const container = document.getElementById('stats-content');
    if (!container) return;
    
    const sales = getFilteredSalesHistory();
    
    let totalRevenue = 0, totalItemsSold = 0, orderCount = sales.length;
    let cashRevenue = 0, transferRevenue = 0, cashOrders = 0, transferOrders = 0;
    
    for (const sale of sales) { 
        let saleItems = 0;
        let saleTotal = 0;
        for (const item of sale.items) { 
            const itemTotal = item.qty * item.price;
            totalRevenue += itemTotal;
            saleItems += item.qty;
            saleTotal += itemTotal;
        } 
        totalItemsSold += saleItems;
        
        if (sale.paymentType === 'transfer') {
            transferRevenue += saleTotal;
            transferOrders++;
        } else {
            cashRevenue += saleTotal;
            cashOrders++;
        }
    }
    const averageCheck = orderCount > 0 ? Math.ceil(totalRevenue / orderCount) : 0;
    
    let totalCostAllGoods = 0;
    let totalStock = 0;
    
    const productFullCostMap = new Map();
    for (const card of originalCardsData) {
        const fullCost = (card.cost || 0) * (card.total || 0);
        totalCostAllGoods += fullCost;
        totalStock += (card.stock || 0);
        productFullCostMap.set(card.id, { 
            cost: card.cost || 0, 
            fullCost: fullCost,
            total: card.total || 0,
            stock: card.stock || 0,
            name: card.name,
            type: card.type,
            attribute1: card.attribute1 || "",
            attribute2: card.attribute2 || "",
            soldQty: 0,
            revenue: 0
        });
    }
    
    for (const sale of sales) {
        for (const item of sale.items) {
            const productData = productFullCostMap.get(item.id);
            if (productData) {
                productData.soldQty += item.qty;
                productData.revenue += item.qty * item.price;
            }
        }
    }
    
    const totalExtraCosts = extraCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0);
    const totalExtraIncomes = extraIncomes.reduce((sum, income) => sum + (income.amount || 0), 0);
    const totalExpenses = totalCostAllGoods + totalExtraCosts - totalExtraIncomes;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;
    
    const productStats = [];
    for (const [id, data] of productFullCostMap) {
        const profit = data.revenue - data.fullCost;
        const margin = data.revenue > 0 ? (profit / data.revenue * 100) : 0;
        productStats.push({
            id: id,
            name: data.name,
            type: data.type,
            attribute1: data.attribute1,
            attribute2: data.attribute2,
            soldQty: data.soldQty,
            stock: data.stock,
            revenue: data.revenue,
            fullCost: data.fullCost,
            profit: profit,
            margin: margin
        });
    }
    productStats.sort((a, b) => b.margin - a.margin);
    
    const typeStats = {};
    for (const card of originalCardsData) {
        const type = card.type || "Другое";
        const fullCost = (card.cost || 0) * (card.total || 0);
        if (!typeStats[type]) {
            typeStats[type] = { 
                fullCost: 0, 
                revenue: 0,
                soldQty: 0,
                attributeStats: {}
            };
        }
        typeStats[type].fullCost += fullCost;
    }
    
    for (const sale of sales) {
        for (const item of sale.items) {
            const card = originalCardsData.find(c => c.id === item.id);
            const type = card?.type || "Другое";
            if (typeStats[type]) {
                typeStats[type].revenue += item.qty * item.price;
                typeStats[type].soldQty += item.qty;
                
                // Собираем статистику по характеристикам (атрибутам)
                if (card.attribute1 && card.attribute1.trim()) {
                    if (!typeStats[type].attributeStats[card.attribute1]) {
                        typeStats[type].attributeStats[card.attribute1] = { revenue: 0, qty: 0 };
                    }
                    typeStats[type].attributeStats[card.attribute1].revenue += item.qty * item.price;
                    typeStats[type].attributeStats[card.attribute1].qty += item.qty;
                }
                if (card.attribute2 && card.attribute2.trim()) {
                    if (!typeStats[type].attributeStats[card.attribute2]) {
                        typeStats[type].attributeStats[card.attribute2] = { revenue: 0, qty: 0 };
                    }
                    typeStats[type].attributeStats[card.attribute2].revenue += item.qty * item.price;
                    typeStats[type].attributeStats[card.attribute2].qty += item.qty;
                }
            }
        }
    }
    
    const typeDetails = Object.entries(typeStats).map(([type, data]) => {
        const profit = data.revenue - data.fullCost;
        const margin = data.revenue > 0 ? (profit / data.revenue * 100) : 0;
        return {
            type: type,
            soldQty: data.soldQty,
            revenue: data.revenue,
            fullCost: data.fullCost,
            profit: profit,
            margin: margin,
            attributeStats: data.attributeStats
        };
    }).sort((a, b) => b.margin - a.margin);
    
    const sortedTypeDetails = [...typeDetails].sort((a, b) => b.soldQty - a.soldQty);
    const topByQty = [...productStats].sort((a, b) => b.soldQty - a.soldQty).slice(0, 5);
    const topTypesByQty = [...typeDetails].sort((a, b) => b.soldQty - a.soldQty).slice(0, 5);
    
    const formatCurrency = (value) => value.toLocaleString('ru-RU') + ' ₽';
    const formatNumber = (value) => value.toLocaleString('ru-RU');
    const formatPercent = (value) => value.toFixed(1) + '%';
    
    let filterInfo = '';
    if (statsFilterActive && (statsFilterFromDate || statsFilterToDate)) {
        const fromStr = statsFilterFromDate ? statsFilterFromDate.toLocaleDateString('ru-RU') : 'все время';
        const toStr = statsFilterToDate ? statsFilterToDate.toLocaleDateString('ru-RU') : 'настоящее';
        filterInfo = `<div style="text-align: center; font-size: 11px; color: var(--text-muted); margin-bottom: 12px;">📅 Период: ${fromStr} — ${toStr}</div>`;
    }
    
    // Добавляем информацию о фильтре по характеристикам
    let attributeFilterInfo = '';
    if (statsAttributeFilterActive && statsSelectedType && statsSelectedValues.length > 0) {
        let valuesText = statsSelectedValues.join(', ');
        attributeFilterInfo = `<div style="text-align: center; font-size: 11px; color: var(--btn-bg); margin-bottom: 12px;">🔍 Фильтр: ${statsSelectedType} → характеристики (${valuesText})</div>`;
    }
    
    let html = filterInfo + attributeFilterInfo;
    
    html += `<div class="stats-grid">
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(totalRevenue)}</div><div class="stats-card-label">💰 Выручка</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(totalCostAllGoods)}</div><div class="stats-card-label">📦 Себестоимость всего товара</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(totalExtraCosts)}</div><div class="stats-card-label">➕ Дополнительные расходы</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(totalExtraIncomes)}</div><div class="stats-card-label">💵 Дополнительные доходы</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(totalExpenses)}</div><div class="stats-card-label">📉 Общие затраты</div></div>
        <div class="stats-card desktop-only"><div class="stats-card-value ${netProfit >= 0 ? 'profit-positive' : 'profit-negative'}">${formatCurrency(netProfit)}</div><div class="stats-card-label">📈 Чистая прибыль</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatNumber(totalItemsSold)}</div><div class="stats-card-label">📊 Продано товаров</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatNumber(totalStock)}</div><div class="stats-card-label">📦 Осталось товаров</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatNumber(orderCount)}</div><div class="stats-card-label">🛒 Количество заказов</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(averageCheck)}</div><div class="stats-card-label">💳 Средний чек</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(cashRevenue)}</div><div class="stats-card-label">💰 Наличные</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(transferRevenue)}</div><div class="stats-card-label">💳 Перевод</div></div>
        <div class="stats-card"><div class="stats-card-value">${cashOrders}</div><div class="stats-card-label">📊 Заказов (нал)</div></div>
        <div class="stats-card"><div class="stats-card-value">${transferOrders}</div><div class="stats-card-label">📊 Заказов (пер)</div></div>
    </div>`;
    
    html += `<div class="profit-mobile-row">
        <div class="profit-mobile-card">
            <div class="profit-mobile-value ${netProfit >= 0 ? 'profit-positive' : 'profit-negative'}">${formatCurrency(netProfit)}</div>
            <div class="profit-mobile-label">📈 Чистая прибыль</div>
        </div>
        <div class="profit-mobile-card">
            <div class="profit-mobile-value">${formatPercent(profitMargin)}</div>
            <div class="profit-mobile-label">📊 Рентабельность</div>
        </div>
    </div>`;
    
    html += `<div class="profit-card-single">
        <div class="profit-card-value ${profitMargin >= 0 ? 'profit-positive' : 'profit-negative'}">${formatPercent(profitMargin)}</div>
        <div class="profit-card-label">📊 Рентабельность</div>
    </div>`;
    
    html += `<div class="detail-section">
        <div class="detail-title">📦 Детализация по товарам</div>
        <div class="table-wrapper">
            <table class="detail-table">
                <thead>
                    <tr><th>Товар</th><th>Тип</th><th>Характеристики</th><th class="text-right">Продано</th><th class="text-right">Остаток</th><th class="text-right">Выручка</th><th class="text-right">Себест.</th><th class="text-right">Прибыль</th><th class="text-right">Рентаб.</th>
                </tr>
                </thead>
                <tbody>`;
    for (const p of productStats) {
        const profitClass = p.profit >= 0 ? 'profit-positive' : 'profit-negative';
        const marginClass = p.margin >= 0 ? 'profit-positive' : 'profit-negative';
        
        // Формируем бейджи для характеристик
        let attributesHtml = "";
        if (p.attribute1 && p.attribute2) {
            const color1 = getTypeColor(p.attribute1);
            const color2 = getTypeColor(p.attribute2);
            attributesHtml = `<span class="type-badge" style="background:${color1}20; color:${color1};">${escapeHtml(p.attribute1)}</span> <span class="type-badge" style="background:${color2}20; color:${color2};">${escapeHtml(p.attribute2)}</span>`;
        } else if (p.attribute1) {
            const color1 = getTypeColor(p.attribute1);
            attributesHtml = `<span class="type-badge" style="background:${color1}20; color:${color1};">${escapeHtml(p.attribute1)}</span>`;
        } else if (p.attribute2) {
            const color2 = getTypeColor(p.attribute2);
            attributesHtml = `<span class="type-badge" style="background:${color2}20; color:${color2};">${escapeHtml(p.attribute2)}</span>`;
        } else {
            attributesHtml = "—";
        }
        
        html += `<tr>
            <td>${escapeHtml(p.name)}</td
            <td><span class="type-badge" style="background:${getTypeColor(p.type)}20; color:${getTypeColor(p.type)};">${escapeHtml(p.type)}</span></td
            <td>${attributesHtml}</td
            <td class="text-right">${p.soldQty} шт</td
            <td class="text-right">${p.stock} шт</td
            <td class="text-right">${formatCurrency(p.revenue)}</td
            <td class="text-right">${formatCurrency(p.fullCost)}</td
            <td class="text-right ${profitClass}">${formatCurrency(p.profit)}</td
            <td class="text-right ${marginClass}">${formatPercent(p.margin)}</td
        </tr>`;
    }
    html += `</tbody>
            </table>
        </div>
    </div>
    <div class="detail-section">
        <div class="detail-title">🏷️ Детализация по типам мерча</div>
        <div class="table-wrapper">
            <table class="detail-table">
                <thead>
                    <tr><th>Тип</th><th class="text-right">Продано</th><th class="text-right">Выручка</th><th class="text-right">Себест.</th><th class="text-right">Прибыль</th><th class="text-right">Рентаб.</th>
                </tr>
                </thead>
                <tbody>`;
    for (const t of sortedTypeDetails) {
        const profitClass = t.profit >= 0 ? 'profit-positive' : 'profit-negative';
        const marginClass = t.margin >= 0 ? 'profit-positive' : 'profit-negative';
        html += `<tr>
            <td><span class="type-badge" style="background:${getTypeColor(t.type)}20; color:${getTypeColor(t.type)};">${escapeHtml(t.type)}</span></td>
            <td class="text-right">${t.soldQty} шт</td>
            <td class="text-right">${formatCurrency(t.revenue)}</td>
            <td class="text-right">${formatCurrency(t.fullCost)}</td>
            <td class="text-right ${profitClass}">${formatCurrency(t.profit)}</td>
            <td class="text-right ${marginClass}">${formatPercent(t.margin)}</td>
        </tr>`;
    }
    html += `</tbody>
        </table>
        </div>
    </div>`;
    
    // Детализация по характеристикам для каждого типа (с бейджами)
    html += `<div class="detail-section">
        <div class="detail-title">🏷️ Детализация по характеристикам (внутри типов)</div>`;
    for (const t of sortedTypeDetails) {
        if (Object.keys(t.attributeStats).length > 0) {
            html += `<div style="margin-top: 16px;">
                <div style="font-weight: bold; margin-bottom: 8px; color: var(--btn-bg);">${escapeHtml(t.type)}</div>
                <div class="table-wrapper">
                    <table class="detail-table-small">
                        <thead>
                            <tr><th>Характеристика</th><th class="text-right">Продано, шт</th><th class="text-right">Выручка</th>
                            </tr>
                        </thead>
                        <tbody>`;
            const sortedAttrs = Object.entries(t.attributeStats).sort((a, b) => b[1].qty - a[1].qty);
            for (const [attr, data] of sortedAttrs) {
                const attrColor = getTypeColor(attr);
                html += `<tr>
                    <td><span class="type-badge" style="background:${attrColor}20; color:${attrColor};">${escapeHtml(attr)}</span></td
                    <td class="text-right">${data.qty} шт</td
                    <td class="text-right">${formatCurrency(data.revenue)}</td
                </tr>`;
            }
            html += `</tbody>
                    </table>
                </div>
            </div>`;
        }
    }
    html += `</div>`;
    
    html += `<div class="two-columns">
        <div class="detail-section">
            <div class="detail-title">🏆 Самые продаваемые товары</div>
            <div class="table-wrapper">
                <table class="detail-table-small">
                    <thead>
                        <tr><th>#</th><th>Товар</th><th>Тип</th><th class="text-right">Продано, шт</th>
                    </tr>
                    </thead>
                    <tbody>`;
    for (let i = 0; i < topByQty.length; i++) { 
        const p = topByQty[i]; 
        html += `<tr>
            <td class="text-right"><span class="popular-badge">${i + 1}</span></td>
            <td>${escapeHtml(p.name)}</td
            <td><span class="type-badge" style="background:${getTypeColor(p.type)}20; color:${getTypeColor(p.type)};">${escapeHtml(p.type)}</span></td
            <td class="text-right">${p.soldQty} шт</td
        </tr>`;
    }
    html += `</tbody>
                </table>
            </div>
        </div>
        <div class="detail-section">
            <div class="detail-title">🏆 Самые продаваемые типы</div>
            <div class="table-wrapper">
                <table class="detail-table-small">
                    <thead>
                        <tr><th>#</th><th>Тип</th><th class="text-right">Продано, шт</th>
                    </tr>
                    </thead>
                    <tbody>`;
    for (let i = 0; i < topTypesByQty.length; i++) { 
        const t = topTypesByQty[i]; 
        html += `<tr>
            <td class="text-right"><span class="popular-badge">${i + 1}</span></td
            <td><span class="type-badge" style="background:${getTypeColor(t.type)}20; color:${getTypeColor(t.type)};">${escapeHtml(t.type)}</span></td
            <td class="text-right">${t.soldQty} шт</td
        </tr>`;
    }
    html += `</tbody>
                </table>
            </div>
        </div>
    </div>
    <div class="extra-costs-section">
        <div class="detail-title">➕ Дополнительные расходы</div>
        <div id="extra-costs-list">`;
    if (extraCosts.length === 0) html += '<div style="color: var(--text-muted); text-align: center; padding: 12px;">Нет дополнительных расходов</div>';
    for (let i = 0; i < extraCosts.length; i++) { 
        const cost = extraCosts[i]; 
        html += `<div class="extra-cost-item">
            <span class="extra-cost-name">${escapeHtml(cost.name)}</span>
            <span class="extra-cost-amount">${cost.amount} ₽</span>
            <button class="extra-cost-delete" onclick="deleteExtraCost(${i})">🗑</button>
        </div>`; 
    }
    html += `</div>
        <div class="add-cost-form">
            <input type="text" id="newCostName" class="add-cost-input" placeholder="Название (стол, доставка...)" autocomplete="off">
            <input type="number" id="newCostAmount" class="add-cost-input-number" placeholder="Сумма" value="0" step="100">
            <button class="add-cost-btn" onclick="addExtraCostFromModal()">➕ Добавить</button>
        </div>
    </div>
    <div class="extra-income-section" style="margin-top: 24px;">
        <div class="detail-title">💵 Дополнительные доходы</div>
        <div id="extra-incomes-list">`;
    if (extraIncomes.length === 0) html += '<div style="color: var(--text-muted); text-align: center; padding: 12px;">Нет дополнительных доходов</div>';
    for (let i = 0; i < extraIncomes.length; i++) { 
        const income = extraIncomes[i]; 
        html += `<div class="extra-cost-item">
            <span class="extra-cost-name">${escapeHtml(income.name)}</span>
            <span class="extra-cost-amount">${income.amount} ₽</span>
            <button class="extra-cost-delete" onclick="deleteExtraIncome(${i})">🗑</button>
        </div>`; 
    }
    html += `</div>
        <div class="add-cost-form">
            <input type="text" id="newIncomeName" class="add-cost-input" placeholder="Название (спонсоры, донаты...)" autocomplete="off">
            <input type="number" id="newIncomeAmount" class="add-cost-input-number" placeholder="Сумма" value="0" step="100">
            <button class="add-cost-btn" onclick="addExtraIncomeFromModal()">➕ Добавить</button>
        </div>
    </div>`;
    container.innerHTML = html;
}

function addExtraCostFromModal() {
    const nameInput = document.getElementById('newCostName');
    const amountInput = document.getElementById('newCostAmount');
    const name = nameInput?.value.trim();
    const amount = parseFloat(amountInput?.value);
    if (!name || isNaN(amount) || amount <= 0) { 
        if (typeof showToast === 'function') showToast("Введите название и сумму расхода", false); 
        return; 
    }
    addExtraCost(name, amount);
    if (nameInput) nameInput.value = '';
    if (amountInput) amountInput.value = '0';
    renderStats();
}

function addExtraIncomeFromModal() {
    const nameInput = document.getElementById('newIncomeName');
    const amountInput = document.getElementById('newIncomeAmount');
    const name = nameInput?.value.trim();
    const amount = parseFloat(amountInput?.value);
    if (!name || isNaN(amount) || amount <= 0) { 
        if (typeof showToast === 'function') showToast("Введите название и сумму дохода", false); 
        return; 
    }
    addExtraIncome(name, amount);
    if (nameInput) nameInput.value = '';
    if (amountInput) amountInput.value = '0';
    renderStats();
}

// Экспортируем новые функции
window.onStatsTypeChange = onStatsTypeChange;
window.onStatsValueChange = onStatsValueChange;
window.applyStatsAttributeFilter = applyStatsAttributeFilter;
window.resetStatsAttributeFilter = resetStatsAttributeFilter;
window.initCustomStatsDateTimeSelects = initCustomStatsDateTimeSelects;
