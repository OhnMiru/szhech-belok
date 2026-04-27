// ========== СТАТИСТИКА ==========
function openStatsModal() {
    const modal = document.getElementById('statsModal');
    if (modal) { renderStats(); modal.style.display = 'block'; }
}

function closeStatsModal() { const modal = document.getElementById('statsModal'); if (modal) modal.style.display = 'none'; }

function renderStats() {
    const container = document.getElementById('stats-content');
    if (!container) return;
    const sales = salesHistory.filter(entry => !entry.isReturn && !entry.hidden);
    let totalRevenue = 0, totalItemsSold = 0, orderCount = sales.length;
    for (const sale of sales) { let saleItems = 0; for (const item of sale.items) { totalRevenue += item.qty * item.price; saleItems += item.qty; } totalItemsSold += saleItems; }
    const averageCheck = orderCount > 0 ? totalRevenue / orderCount : 0;
    let totalCostAllGoods = 0;
    for (const card of originalCardsData) totalCostAllGoods += (card.cost || 0) * (card.total || 0);
    const totalExtraCosts = extraCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0);
    const totalExpenses = totalCostAllGoods + totalExtraCosts;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;
    const productStats = {}, typeStats = {};
    for (const sale of sales) {
        for (const item of sale.items) {
            const card = originalCardsData.find(c => c.name === item.name);
            const type = card?.type || "Другое";
            const revenue = item.qty * item.price;
            const totalCostForItem = (card?.cost || 0) * (card?.total || 0);
            if (!productStats[item.name]) productStats[item.name] = { type: type, qty: 0, revenue: 0, totalCost: totalCostForItem };
            productStats[item.name].qty += item.qty;
            productStats[item.name].revenue += revenue;
            if (!typeStats[type]) typeStats[type] = { qty: 0, revenue: 0, totalCost: 0 };
            typeStats[type].qty += item.qty;
            typeStats[type].revenue += revenue;
            typeStats[type].totalCost += totalCostForItem;
        }
    }
    const productDetails = Object.entries(productStats).map(([name, data]) => ({ name: name, type: data.type, qty: data.qty, revenue: data.revenue, totalCost: data.totalCost, profit: data.revenue - data.totalCost, margin: data.revenue > 0 ? ((data.revenue - data.totalCost) / data.revenue * 100) : 0 })).sort((a, b) => b.margin - a.margin);
    const typeDetails = Object.entries(typeStats).map(([type, data]) => ({ type: type, qty: data.qty, revenue: data.revenue, totalCost: data.totalCost, profit: data.revenue - data.totalCost, margin: data.revenue > 0 ? ((data.revenue - data.totalCost) / data.revenue * 100) : 0 })).sort((a, b) => b.margin - a.margin);
    const topByQty = Object.entries(productStats).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);
    const topTypesByQty = Object.entries(typeStats).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);
    const formatCurrency = (value) => value.toLocaleString('ru-RU') + ' ₽';
    const formatNumber = (value) => value.toLocaleString('ru-RU');
    const formatPercent = (value) => value.toFixed(1) + '%';
    let html = `<div class="stats-grid"><div class="stats-card"><div class="stats-card-value">${formatCurrency(totalRevenue)}</div><div class="stats-card-label">💰 Выручка</div></div>
            <div class="stats-card"><div class="stats-card-value">${formatCurrency(totalCostAllGoods)}</div><div class="stats-card-label">📦 Себестоимость всего товара</div></div>
            <div class="stats-card"><div class="stats-card-value">${formatCurrency(totalExtraCosts)}</div><div class="stats-card-label">➕ Дополнительные расходы</div></div>
            <div class="stats-card"><div class="stats-card-value">${formatCurrency(totalExpenses)}</div><div class="stats-card-label">📉 Общие затраты</div></div>
            <div class="stats-card"><div class="stats-card-value ${netProfit >= 0 ? 'profit-positive' : 'profit-negative'}">${formatCurrency(netProfit)}</div><div class="stats-card-label">📈 Чистая прибыль</div></div>
            <div class="stats-card"><div class="stats-card-value">${formatNumber(totalItemsSold)}</div><div class="stats-card-label">📊 Продано единиц</div></div>
            <div class="stats-card"><div class="stats-card-value">${formatNumber(orderCount)}</div><div class="stats-card-label">🛒 Количество заказов</div></div>
            <div class="stats-card"><div class="stats-card-value">${formatCurrency(averageCheck)}</div><div class="stats-card-label">💳 Средний чек</div></div></div>
        <div class="stats-summary-compact"><div class="stats-summary-value ${profitMargin >= 0 ? 'profit-positive' : 'profit-negative'}">${formatPercent(profitMargin)}</div><div class="stats-summary-label">Рентабельность продаж</div></div>
        <div class="detail-section"><div class="detail-title">📦 Детализация по товарам</div><table class="detail-table"><thead><tr><th>Товар</th><th>Тип</th><th class="text-right">Кол-во</th><th class="text-right">Выручка</th><th class="text-right">Себест.</th><th class="text-right">Прибыль</th><th class="text-right">Рентаб.</th></tr></thead><tbody>`;
    for (const p of productDetails) html += `<tr><td>${escapeHtml(p.name)}</td><td><span class="type-badge" style="background:${getTypeColor(p.type)}20; color:${getTypeColor(p.type)};">${escapeHtml(p.type)}</span></td><td class="text-right">${p.qty} шт</td><td class="text-right">${formatCurrency(p.revenue)}</td><td class="text-right">${formatCurrency(p.totalCost)}</td><td class="text-right ${p.profit >= 0 ? 'profit-positive' : 'profit-negative'}">${formatCurrency(p.profit)}</td><td class="text-right ${p.margin >= 0 ? 'profit-positive' : 'profit-negative'}">${formatPercent(p.margin)}</td></tr>`;
    html += `</tbody></table></div><div class="detail-section"><div class="detail-title">🏷️ Детализация по типам мерча</div><table class="detail-table"><thead><tr><th>Тип</th><th class="text-right">Кол-во</th><th class="text-right">Выручка</th><th class="text-right">Себест.</th><th class="text-right">Прибыль</th><th class="text-right">Рентаб.</th></tr></thead><tbody>`;
    for (const t of typeDetails) html += `<tr><td><span class="type-badge" style="background:${getTypeColor(t.type)}20; color:${getTypeColor(t.type)};">${escapeHtml(t.type)}</span></td><td class="text-right">${t.qty} шт</td><td class="text-right">${formatCurrency(t.revenue)}</td><td class="text-right">${formatCurrency(t.totalCost)}</td><td class="text-right ${t.profit >= 0 ? 'profit-positive' : 'profit-negative'}">${formatCurrency(t.profit)}</td><td class="text-right ${t.margin >= 0 ? 'profit-positive' : 'profit-negative'}">${formatPercent(t.margin)}</td></tr>`;
    html += `</tbody></table></div><div class="two-columns"><div class="detail-section"><div class="detail-title">🏆 Самые популярные товары</div><table class="detail-table"><thead><tr><th>#</th><th>Товар</th><th>Тип</th><th class="text-right">Продано, шт</th></tr></thead><tbody>`;
    for (let i = 0; i < topByQty.length; i++) { const [name, data] = topByQty[i]; html += `<tr><td class="text-right"><span class="popular-badge">${i + 1}</span></td><td>${escapeHtml(name)}</td><td><span class="type-badge" style="background:${getTypeColor(data.type)}20; color:${getTypeColor(data.type)};">${escapeHtml(data.type)}</span></td><td class="text-right">${data.qty} шт</td></tr>`; }
    html += `</tbody></table></div><div class="detail-section"><div class="detail-title">🏆 Самые популярные типы мерча</div><table class="detail-table"><thead><tr><th>#</th><th>Тип</th><th class="text-right">Продано, шт</th></tr></thead><tbody>`;
    for (let i = 0; i < topTypesByQty.length; i++) { const [type, data] = topTypesByQty[i]; html += `<tr><td class="text-right"><span class="popular-badge">${i + 1}</span></td><td><span class="type-badge" style="background:${getTypeColor(type)}20; color:${getTypeColor(type)};">${escapeHtml(type)}</span></td><td class="text-right">${data.qty} шт</td></tr>`; }
    html += `</tbody></table></div></div><div class="extra-costs-section"><div class="detail-title">➕ Дополнительные расходы</div><div id="extra-costs-list">`;
    if (extraCosts.length === 0) html += '<div style="color: var(--text-muted); text-align: center; padding: 12px;">Нет дополнительных расходов</div>';
    for (let i = 0; i < extraCosts.length; i++) { const cost = extraCosts[i]; html += `<div class="extra-cost-item"><span class="extra-cost-name">${escapeHtml(cost.name)}</span><span class="extra-cost-amount">${cost.amount} ₽</span><button class="extra-cost-delete" onclick="deleteExtraCost(${i})">🗑</button></div>`; }
    html += `</div><div class="add-cost-form"><input type="text" id="newCostName" class="add-cost-input" placeholder="Название (стол, доставка...)" autocomplete="off"><input type="number" id="newCostAmount" class="add-cost-input-number" placeholder="Сумма" value="0" step="100"><button class="add-cost-btn" onclick="addExtraCostFromModal()">➕ Добавить</button></div></div>`;
    container.innerHTML = html;
}

function addExtraCostFromModal() {
    const nameInput = document.getElementById('newCostName');
    const amountInput = document.getElementById('newCostAmount');
    const name = nameInput?.value.trim();
    const amount = parseFloat(amountInput?.value);
    if (!name || isNaN(amount) || amount <= 0) { showToast("Введите название и сумму расхода", false); return; }
    addExtraCost(name, amount);
    if (nameInput) nameInput.value = '';
    if (amountInput) amountInput.value = '0';
    renderStats();
}
