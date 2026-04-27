// ========== ГЛОБАЛЬНАЯ СТАТИСТИКА ==========
async function showGlobalStats() {
    const modal = document.getElementById('globalStatsModal');
    if (!modal) return;
    modal.style.display = 'block';
    const container = document.getElementById('globalStats-content');
    container.innerHTML = '<div class="loading">Загрузка статистики всех участников...</div>';
    try {
        await loadGlobalExtraCosts();
        const response = await fetch(`${CENTRAL_API_URL}?action=getAllStatsFull&participant=${CURRENT_USER.id}&t=${Date.now()}`);
        const data = await response.json();
        window._globalStatsData = data;
        renderGlobalStatsWithData(data);
    } catch(e) { 
        container.innerHTML = '<div class="loading">Ошибка загрузки статистики</div>'; 
        showToast("Ошибка загрузки статистики", false); 
    }
}

function renderGlobalStatsWithData(data) {
    const container = document.getElementById('globalStats-content');
    if (!container) return;
    
    let html = `<div class="participant-custom-select" id="participantSelectContainer">
            <div class="participant-custom-select-trigger" id="participantSelectTrigger">📊 Все участники</div>
            <div class="participant-custom-select-dropdown" id="participantSelectDropdown">
                <div class="participant-option selected" data-id="all">📊 Все участники</div>`;
    for (const p of (data.participants || [])) {
        if (p.hideStats !== true || CURRENT_USER.role === 'organizer') {
            html += `<div class="participant-option" data-id="${escapeHtml(p.id)}">${escapeHtml(p.name)} (${p.role === 'organizer' ? 'Организатор' : 'Художник'})</div>`;
        }
    }
    html += `</div></div><div id="participantStatsContainer"></div>`;
    container.innerHTML = html;
    
    renderGlobalStatsContent(data);
    
    const trigger = document.getElementById('participantSelectTrigger');
    const dropdown = document.getElementById('participantSelectDropdown');
    if (trigger && dropdown) {
        trigger.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.toggle('show'); });
        document.querySelectorAll('.participant-option').forEach(opt => {
            opt.addEventListener('click', async (e) => {
                const id = opt.dataset.id;
                document.querySelectorAll('.participant-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                const selectedName = opt.textContent.replace('📊 ', '');
                trigger.textContent = selectedName.length > 30 ? selectedName.substring(0, 27) + '...' : selectedName;
                dropdown.classList.remove('show');
                if (id === 'all') {
                    renderGlobalStatsContent(data);
                } else {
                    const userStats = await fetch(`${CENTRAL_API_URL}?action=getUserFullStats&participant=${CURRENT_USER.id}&targetUser=${encodeURIComponent(id)}&t=${Date.now()}`).then(r => r.json());
                    renderSingleParticipantStats(userStats);
                }
            });
        });
        document.addEventListener('click', (e) => { if (!trigger.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.remove('show'); });
    }
}

function renderGlobalStatsContent(data) {
    const container = document.getElementById('participantStatsContainer');
    if (!container) return;
    const stats = data.stats || [];
    const totalRevenue = data.totalRevenue || 0;
    const totalCost = data.totalCost || 0;
    const totalNetProfit = data.totalNetProfit || 0;
    const totalItemsSold = data.totalItemsSold || 0;
    const totalGoods = data.totalGoods || 0;
    const avgCheck = data.avgCheck || 0;
    const profitMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue * 100) : 0;
    let html = `<div class="stats-grid"><div class="stats-card"><div class="stats-card-value">${totalRevenue.toLocaleString()} ₽</div><div class="stats-card-label">💰 Общая выручка</div></div>
            <div class="stats-card"><div class="stats-card-value">${totalCost.toLocaleString()} ₽</div><div class="stats-card-label">📦 Общая себестоимость</div></div>
            <div class="stats-card"><div class="stats-card-value ${totalNetProfit >= 0 ? 'profit-positive' : 'profit-negative'}">${totalNetProfit.toLocaleString()} ₽</div><div class="stats-card-label">📈 Общая чистая прибыль</div></div>
            <div class="stats-card"><div class="stats-card-value">${totalItemsSold.toLocaleString()} шт</div><div class="stats-card-label">📊 Продано единиц</div></div>
            <div class="stats-card"><div class="stats-card-value">${totalGoods.toLocaleString()} шт</div><div class="stats-card-label">📦 Всего товаров</div></div>
            <div class="stats-card"><div class="stats-card-value">${avgCheck.toLocaleString()} ₽</div><div class="stats-card-label">💳 Средний чек</div></div></div>
        <div class="stats-summary-compact"><div class="stats-summary-value ${profitMargin >= 0 ? 'profit-positive' : 'profit-negative'}">${profitMargin.toFixed(1)}%</div><div class="stats-summary-label">Общая рентабельность</div></div>
        <div class="detail-section"><div class="detail-title">📊 Статистика по участникам</div><table class="detail-table"><thead><tr><th>Участник</th><th>Роль</th><th class="text-right">Выручка</th><th class="text-right">Чистая прибыль</th>
            <th class="text-right">Продано единиц</th><th class="text-right">Всего товаров</th><th class="text-right">Средний чек</th><th class="text-right">Рентабельность</th></tr></thead><tbody>`;
    for (const s of stats) {
        if (s.hideStats === true && CURRENT_USER.role !== 'organizer') continue;
        const profitClass = (s.netProfit || 0) >= 0 ? 'profit-positive' : 'profit-negative';
        const marginClass = (s.profitMargin || 0) >= 0 ? 'profit-positive' : 'profit-negative';
        html += `<tr><td>${escapeHtml(s.name)}</td><td>${s.role === 'organizer' ? 'Организатор' : 'Художник'}</td>
                <td class="text-right">${(s.totalRevenue || 0).toLocaleString()} ₽</td>
                <td class="text-right ${profitClass}">${(s.netProfit || 0).toLocaleString()} ₽</td>
                <td class="text-right">${(s.totalItemsSold || 0).toLocaleString()} шт</td>
                <td class="text-right">${(s.totalGoods || 0).toLocaleString()} шт</td>
                <td class="text-right">${(s.averageCheck || 0).toLocaleString()} ₽</td>
                <td class="text-right ${marginClass}">${(s.profitMargin || 0).toFixed(1)}%</td></tr>`;
    }
    html += `</tbody></table></div>`;
    
    if (data.typeDetails && data.typeDetails.length > 0) {
        html += `<div class="detail-section"><div class="detail-title">🏷️ Рентабельность по типам мерча</div><table class="detail-table"><thead><tr><th>Тип</th><th class="text-right">Кол-во</th><th class="text-right">Выручка</th><th class="text-right">Прибыль</th><th class="text-right">Рентаб.</th></tr></thead><tbody>`;
        for (const t of data.typeDetails) {
            const tProfitClass = (t.profit || 0) >= 0 ? 'profit-positive' : 'profit-negative';
            const tMarginClass = (t.margin || 0) >= 0 ? 'profit-positive' : 'profit-negative';
            html += `<tr><td><span class="type-badge" style="background:${getTypeColor(t.type)}20; color:${getTypeColor(t.type)};">${escapeHtml(t.type)}</span></td>
                    <td class="text-right">${t.qty} шт</td>
                    <td class="text-right">${t.revenue.toLocaleString()} ₽</td>
                    <td class="text-right ${tProfitClass}">${t.profit.toLocaleString()} ₽</td>
                    <td class="text-right ${tMarginClass}">${t.margin.toFixed(1)}%</td></tr>`;
        }
        html += `</tbody></table></div>`;
    }
    
    if (data.topProducts && data.topProducts.length > 0) {
        html += `<div class="detail-section"><div class="detail-title">🏆 Популярные позиции</div><table class="detail-table"><thead><tr><th>#</th><th>Товар</th><th>Тип</th><th class="text-right">Кол-во</th><th class="text-right">Выручка</th><th class="text-right">Прибыль</th><th class="text-right">Рентаб.</th></tr></thead><tbody>`;
        for (let i = 0; i < data.topProducts.length; i++) {
            const p = data.topProducts[i];
            const pProfitClass = (p.profit || 0) >= 0 ? 'profit-positive' : 'profit-negative';
            const pMarginClass = (p.margin || 0) >= 0 ? 'profit-positive' : 'profit-negative';
            html += `<tr><td class="text-right"><span class="popular-badge">${i + 1}</span></td>
                    <td>${escapeHtml(p.name)}</td>
                    <td><span class="type-badge" style="background:${getTypeColor(p.type)}20; color:${getTypeColor(p.type)};">${escapeHtml(p.type)}</span></td>
                    <td class="text-right">${p.qty} шт</td>
                    <td class="text-right">${p.revenue.toLocaleString()} ₽</td>
                    <td class="text-right ${pProfitClass}">${p.profit.toLocaleString()} ₽</td>
                    <td class="text-right ${pMarginClass}">${p.margin.toFixed(1)}%</td></tr>`;
        }
        html += `</tbody></table></div>`;
    }
    
    if (data.topTypes && data.topTypes.length > 0) {
        html += `<div class="detail-section"><div class="detail-title">🏆 Популярные типы мерча</div><table class="detail-table"><thead><tr><th>#</th><th>Тип</th><th class="text-right">Кол-во</th><th class="text-right">Выручка</th><th class="text-right">Прибыль</th><th class="text-right">Рентаб.</th></tr></thead><tbody>`;
        for (let i = 0; i < data.topTypes.length; i++) {
            const t = data.topTypes[i];
            const tProfitClass = (t.profit || 0) >= 0 ? 'profit-positive' : 'profit-negative';
            const tMarginClass = (t.margin || 0) >= 0 ? 'profit-positive' : 'profit-negative';
            html += `<tr><td class="text-right"><span class="popular-badge">${i + 1}</span></td>
                    <td><span class="type-badge" style="background:${getTypeColor(t.type)}20; color:${getTypeColor(t.type)};">${escapeHtml(t.type)}</span></td>
                    <td class="text-right">${t.qty} шт</td>
                    <td class="text-right">${t.revenue.toLocaleString()} ₽</td>
                    <td class="text-right ${tProfitClass}">${t.profit.toLocaleString()} ₽</td>
                    <td class="text-right ${tMarginClass}">${t.margin.toFixed(1)}%</td></tr>`;
        }
        html += `</tbody></table></div>`;
    }
    
    if (CURRENT_USER.role === 'organizer') {
        html += `<div class="extra-costs-section"><div class="detail-title">➕ Общие расходы организатора</div><div id="global-extra-costs-list">`;
        if (globalExtraCosts.length === 0) html += '<div style="color: var(--text-muted); text-align: center; padding: 12px;">Нет дополнительных расходов</div>';
        for (let i = 0; i < globalExtraCosts.length; i++) {
            const cost = globalExtraCosts[i];
            html += `<div class="extra-cost-item"><span class="extra-cost-name">${escapeHtml(cost.name)}</span><span class="extra-cost-amount">${cost.amount} ₽</span><button class="extra-cost-delete" onclick="deleteGlobalExtraCost(${i})">🗑</button></div>`;
        }
        html += `</div><div class="add-cost-form"><input type="text" id="newGlobalCostName" class="add-cost-input" placeholder="Название (аренда, доставка...)" autocomplete="off"><input type="number" id="newGlobalCostAmount" class="add-cost-input-number" placeholder="Сумма" value="0" step="100"><button class="add-cost-btn" onclick="addGlobalExtraCostFromModal()">➕ Добавить</button></div></div>`;
    }
    
    container.innerHTML = html;
}

async function renderGlobalStatsWithCosts() {
    const container = document.getElementById('participantStatsContainer');
    if (!container) return;
    await loadGlobalExtraCosts();
    if (window._globalStatsData) {
        renderGlobalStatsContent(window._globalStatsData);
    }
}

async function addGlobalExtraCostFromModal() {
    const nameInput = document.getElementById('newGlobalCostName');
    const amountInput = document.getElementById('newGlobalCostAmount');
    const name = nameInput?.value.trim();
    const amount = parseFloat(amountInput?.value);
    if (!name || isNaN(amount) || amount <= 0) {
        showToast("Введите название и сумму расхода", false);
        return;
    }
    await addGlobalExtraCost(name, amount);
    if (nameInput) nameInput.value = '';
    if (amountInput) amountInput.value = '0';
    if (document.getElementById('globalStatsModal')?.style.display === 'block') {
        const response = await fetch(`${CENTRAL_API_URL}?action=getAllStatsFull&participant=${CURRENT_USER.id}&t=${Date.now()}`);
        const data = await response.json();
        window._globalStatsData = data;
        renderGlobalStatsContent(data);
    }
}

function renderSingleParticipantStats(stats) {
    const container = document.getElementById('participantStatsContainer');
    if (!container) return;
    const profitClass = (stats.netProfit || 0) >= 0 ? 'profit-positive' : 'profit-negative';
    const marginClass = (stats.profitMargin || 0) >= 0 ? 'profit-positive' : 'profit-negative';
    let html = `<div class="stats-grid"><div class="stats-card"><div class="stats-card-value">${(stats.totalRevenue || 0).toLocaleString()} ₽</div><div class="stats-card-label">💰 Выручка</div></div>
            <div class="stats-card"><div class="stats-card-value">${(stats.totalCost || 0).toLocaleString()} ₽</div><div class="stats-card-label">📦 Себестоимость</div></div>
            <div class="stats-card"><div class="stats-card-value ${profitClass}">${(stats.netProfit || 0).toLocaleString()} ₽</div><div class="stats-card-label">📈 Чистая прибыль</div></div>
            <div class="stats-card"><div class="stats-card-value">${(stats.totalItemsSold || 0).toLocaleString()} шт</div><div class="stats-card-label">📊 Продано единиц</div></div>
            <div class="stats-card"><div class="stats-card-value">${(stats.totalGoods || 0).toLocaleString()} шт</div><div class="stats-card-label">📦 Всего товаров</div></div>
            <div class="stats-card"><div class="stats-card-value">${(stats.averageCheck || 0).toLocaleString()} ₽</div><div class="stats-card-label">💳 Средний чек</div></div></div>
        <div class="stats-summary-compact"><div class="stats-summary-value ${marginClass}">${(stats.profitMargin || 0).toFixed(1)}%</div><div class="stats-summary-label">Рентабельность продаж</div></div>`;
    if (stats.productDetails && stats.productDetails.length > 0) {
        html += `<div class="detail-section"><div class="detail-title">📦 Детализация по товарам</div><table class="detail-table"><thead><tr><th>Товар</th><th>Тип</th><th class="text-right">Кол-во</th><th class="text-right">Выручка</th><th class="text-right">Прибыль</th><th class="text-right">Рентаб.</th></tr></thead><tbody>`;
        for (const p of stats.productDetails) {
            const pProfitClass = (p.profit || 0) >= 0 ? 'profit-positive' : 'profit-negative';
            const pMarginClass = (p.margin || 0) >= 0 ? 'profit-positive' : 'profit-negative';
            html += `<tr><td class="text-right"></td><td>${escapeHtml(p.name)}</td><td><span class="type-badge" style="background:${getTypeColor(p.type)}20; color:${getTypeColor(p.type)};">${escapeHtml(p.type)}</span></td><td class="text-right">${p.qty} шт</td><td class="text-right">${p.revenue.toLocaleString()} ₽</td><td class="text-right ${pProfitClass}">${p.profit.toLocaleString()} ₽</td><td class="text-right ${pMarginClass}">${p.margin.toFixed(1)}%</td></tr>`;
        }
        html += `</tbody></table></div>`;
    }
    if (stats.typeDetails && stats.typeDetails.length > 0) {
        html += `<div class="detail-section"><div class="detail-title">🏷️ Детализация по типам мерча</div><table class="detail-table"><thead><tr><th>Тип</th><th class="text-right">Кол-во</th><th class="text-right">Выручка</th><th class="text-right">Прибыль</th><th class="text-right">Рентаб.</th></tr></thead><tbody>`;
        for (const t of stats.typeDetails) {
            const tProfitClass = (t.profit || 0) >= 0 ? 'profit-positive' : 'profit-negative';
            const tMarginClass = (t.margin || 0) >= 0 ? 'profit-positive' : 'profit-negative';
            html += `<tr><td><span class="type-badge" style="background:${getTypeColor(t.type)}20; color:${getTypeColor(t.type)};">${escapeHtml(t.type)}</span></td><td class="text-right">${t.qty} шт</td><td class="text-right">${t.revenue.toLocaleString()} ₽</td><td class="text-right ${tProfitClass}">${t.profit.toLocaleString()} ₽</td><td class="text-right ${tMarginClass}">${t.margin.toFixed(1)}%</td></tr>`;
        }
        html += `</tbody></table></div>`;
    }
    container.innerHTML = html;
}

function closeGlobalStatsModal() { 
    const modal = document.getElementById('globalStatsModal'); 
    if (modal) modal.style.display = 'none'; 
}
