// ========== ДАТА И ВРЕМЯ ==========
function initDateTimeSelects() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) years.push(i);
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    
    ['dateFromDay', 'dateToDay'].forEach(id => {
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
    
    ['dateFromMonth', 'dateToMonth'].forEach(id => {
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
    
    ['dateFromYear', 'dateToYear'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '';
            for (const year of years) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                select.appendChild(option);
            }
        }
    });
    
    ['timeFromHour', 'timeToHour'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '';
            for (let i = 0; i <= 23; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i.toString().padStart(2, '0');
                select.appendChild(option);
            }
        }
    });
    
    ['timeFromMinute', 'timeToMinute'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '';
            for (let i = 0; i <= 59; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i.toString().padStart(2, '0');
                select.appendChild(option);
            }
        }
    });
}

function getDateTimeFromSelects(prefix) {
    const day = document.getElementById(`${prefix}Day`)?.value;
    const month = document.getElementById(`${prefix}Month`)?.value;
    const year = document.getElementById(`${prefix}Year`)?.value;
    const hour = document.getElementById(`time${prefix === 'dateFrom' ? 'From' : 'To'}Hour`)?.value;
    const minute = document.getElementById(`time${prefix === 'dateFrom' ? 'From' : 'To'}Minute`)?.value;
    if (day && month && year && hour && minute) {
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    }
    return null;
}

function bindDateTimeEvents() {
    const selectIds = ['dateFromDay', 'dateFromMonth', 'dateFromYear', 'timeFromHour', 'timeFromMinute', 'dateToDay', 'dateToMonth', 'dateToYear', 'timeToHour', 'timeToMinute'];
    for (const id of selectIds) { 
        const el = document.getElementById(id); 
        if (el) el.addEventListener('change', () => renderHistoryList()); 
    }
    const minPrice = document.getElementById('historyMinPrice');
    const maxPrice = document.getElementById('historyMaxPrice');
    if (minPrice) minPrice.addEventListener('input', () => renderHistoryList());
    if (maxPrice) maxPrice.addEventListener('input', () => renderHistoryList());
}

function startAutoRefresh() { 
    if (autoRefreshInterval) clearInterval(autoRefreshInterval); 
    autoRefreshInterval = setInterval(() => { loadData(false, true); }, 120000); 
}
