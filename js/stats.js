// ========== СТАТИСТИКА ==========

// Переменные для фильтра
let statsFilterFromDate = null;
let statsFilterToDate = null;
let statsFilterActive = false;

function openStatsModal() {
    const modal = document.getElementById('statsModal');
    if (modal) {
        // Инициализируем селекты дат при открытии
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

// Инициализация селектов даты и времени для статистики
function initStatsDateTimeSelects() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) years.push(i);
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    
    // Дни
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
    
    // Месяцы
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
    
    // Годы
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
            // Устанавливаем текущий год по умолчанию
            if (select.id.includes('To')) {
                select.value = currentYear;
            } else {
                select.value = currentYear - 1;
            }
        }
    });
    
    // Часы
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
    
    // Минуты
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
}

// Получение даты из селектов
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

// Переключение видимости фильтра
function toggleStatsFilter() {
    const block = document.getElementById('statsFilterBlock');
    if (block) {
        const isVisible = block.style.display !== 'none';
        block.style.display = isVisible ? 'none' : 'block';
    }
}

// Сброс фильтра
function resetStatsFilter() {
    // Сбрасываем селекты на значения по умолчанию
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

// Установка значений селектов
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

// Применение фильтра
function applyStatsFilter() {
    statsFilterFromDate = getStatsDateTimeFromSelects('statsDateFrom');
    statsFilterToDate = getStatsDateTimeFromSelects('statsDateTo');
    statsFilterActive = true;
    renderStats();
}

// Получение отфильтрованной истории
function getFilteredSalesHistory() {
    let filteredSales = salesHistory.filter(entry => !entry.isReturn && !entry.hidden);
    
    if (statsFilterActive && statsFilterFromDate) {
        filteredSales = filteredSales.filter(entry => new Date(entry.date) >= statsFilterFromDate);
    }
    if (statsFilterActive && statsFilterToDate) {
        filteredSales = filteredSales.filter(entry => new Date(entry.date) <= statsFilterToDate);
    }
    
    return filteredSales;
}

function renderStats() {
    const container = document.getElementById('stats-content');
    if (!container) return;
    
    // Используем отфильтрованную историю
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
                soldQty: 0
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
            margin: margin
        };
    }).sort((a, b) => b.margin - a.margin);
    
    const sortedTypeDetails = [...typeDetails].sort((a, b) => b.soldQty - a.soldQty);
    const topByQty = [...productStats].sort((a, b) => b.soldQty - a.soldQty).slice(0, 5);
    const topTypesByQty = [...typeDetails].sort((a, b) => b.soldQty - a.soldQty).slice(0, 5);
    
    const formatCurrency = (value) => value.toLocaleString('ru-RU') + ' ₽';
    const formatNumber = (value) => value.toLocaleString('ru-RU');
    const formatPercent = (value) => value.toFixed(1) + '%';
    
    // Добавляем информацию о фильтре
    let filterInfo = '';
    if (statsFilterActive && (statsFilterFromDate || statsFilterToDate)) {
        const fromStr = statsFilterFromDate ? statsFilterFromDate.toLocaleDateString('ru-RU') : 'все время';
        const toStr = statsFilterToDate ? statsFilterToDate.toLocaleDateString('ru-RU') : 'настоящее';
        filterInfo = `<div style="text-align: center; font-size: 11px; color: var(--text-muted); margin-bottom: 12px;">📅 Период: ${fromStr} — ${toStr}</div>`;
    }
    
    let html = filterInfo;
    
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
                    <tr><th>Товар</th><th>Тип</th><th class="text-right">Продано</th><th class="text-right">Остаток</th><th class="text-right">Выручка</th><th class="text-right">Себест.</th><th class="text-right">Прибыль</th><th class="text-right">Рентаб.</th>
                </tr>
                </thead>
                <tbody>`;
    for (const p of productStats) {
        const profitClass = p.profit >= 0 ? 'profit-positive' : 'profit-negative';
        const marginClass = p.margin >= 0 ? 'profit-positive' : 'profit-negative';
        html += `<tr>
            <td>${escapeHtml(p.name)}</td>
            <td><span class="type-badge" style="background:${getTypeColor(p.type)}20; color:${getTypeColor(p.type)};">${escapeHtml(p.type)}</span></td>
            <td class="text-right">${p.soldQty} шт</td>
            <td class="text-right">${p.stock} шт</td>
            <td class="text-right">${formatCurrency(p.revenue)}</td>
            <td class="text-right">${formatCurrency(p.fullCost)}</td>
            <td class="text-right ${profitClass}">${formatCurrency(p.profit)}</td>
            <td class="text-right ${marginClass}">${formatPercent(p.margin)}</td>
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
    </div>
    <div class="two-columns">
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
            <td>${escapeHtml(p.name)}</td>
            <td><span class="type-badge" style="background:${getTypeColor(p.type)}20; color:${getTypeColor(p.type)};">${escapeHtml(p.type)}</span></td>
            <td class="text-right">${p.soldQty} шт</td>
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
            <td class="text-right"><span class="popular-badge">${i + 1}</span></td>
            <td><span class="type-badge" style="background:${getTypeColor(t.type)}20; color:${getTypeColor(t.type)};">${escapeHtml(t.type)}</span></td>
            <td class="text-right">${t.soldQty} шт</td>
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
