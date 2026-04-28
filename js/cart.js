function applyCartDiscountToAll(type, totalDiscountValue) {
    // Получаем все товары в корзине
    const cartItems = [];
    for (const [idStr, qty] of Object.entries(cart)) {
        if (qty > 0) {
            const id = parseInt(idStr);
            const card = originalCardsData.find(c => c.id === id);
            if (card) {
                // Добавляем каждый товар с учётом количества (каждая единица отдельно)
                for (let i = 0; i < qty; i++) {
                    cartItems.push({
                        id: id,
                        originalPrice: card.price,
                        name: card.name,
                        type: card.type
                    });
                }
            }
        }
    }
    
    if (cartItems.length === 0) {
        showToast("Корзина пуста", false);
        return;
    }
    
    if (type === 'percent') {
        // Процентная скидка
        const percent = totalDiscountValue;
        for (const item of cartItems) {
            const discountedPrice = item.originalPrice * (1 - percent / 100);
            const discountValue = item.originalPrice - discountedPrice;
            
            if (!itemDiscounts[item.id]) itemDiscounts[item.id] = {};
            // Сохраняем сумму скидки на каждую единицу
            const existingDiscount = itemDiscounts[item.id].valuePerItem || 0;
            itemDiscounts[item.id] = { 
                type: 'fixed', 
                valuePerItem: existingDiscount + discountValue,
                value: (existingDiscount + discountValue) * (cart[id] ? cart[id] : 1)
            };
        }
    } else {
        // Фиксированная скидка в рублях
        let remainingDiscount = totalDiscountValue;
        
        // Создаём массив цен каждой единицы товара
        let itemPrices = cartItems.map(item => ({
            id: item.id,
            originalPrice: item.originalPrice,
            currentPrice: item.originalPrice,
            name: item.name
        }));
        
        // Пока есть остаток скидки и есть товары
        let iteration = 0;
        const maxIterations = 100; // защита от бесконечного цикла
        
        while (remainingDiscount > 0.01 && iteration < maxIterations) {
            iteration++;
            
            // Находим товары, которые ещё не обнулились
            const activeItems = itemPrices.filter(item => item.currentPrice > 0);
            if (activeItems.length === 0) break;
            
            // Распределяем остаток поровну на активные товары
            const discountPerItem = remainingDiscount / activeItems.length;
            
            let newRemainingDiscount = 0;
            
            for (const item of activeItems) {
                let newPrice = item.currentPrice - discountPerItem;
                if (newPrice < 0) {
                    // Товар обнулился, излишек скидки добавляем к остатку
                    newRemainingDiscount += Math.abs(newPrice);
                    item.currentPrice = 0;
                } else {
                    item.currentPrice = newPrice;
                }
            }
            
            remainingDiscount = newRemainingDiscount;
        }
        
        // Собираем скидки по каждому ID товара (суммируем по всем единицам)
        const discountByItemId = {};
        for (const item of itemPrices) {
            const discountValue = item.originalPrice - item.currentPrice;
            if (!discountByItemId[item.id]) {
                discountByItemId[item.id] = 0;
            }
            discountByItemId[item.id] += discountValue;
        }
        
        // Применяем скидки
        for (const [id, totalDiscountForItem] of Object.entries(discountByItemId)) {
            const numericId = parseInt(id);
            const qty = cart[numericId] || 1;
            const discountPerUnit = totalDiscountForItem / qty;
            
            if (!itemDiscounts[numericId]) itemDiscounts[numericId] = {};
            itemDiscounts[numericId] = { 
                type: 'fixed', 
                value: discountPerUnit,
                valuePerItem: discountPerUnit
            };
        }
    }
    
    // Обновляем итоговую цену в itemDiscounts для корректного отображения
    for (const [idStr, qty] of Object.entries(cart)) {
        const id = parseInt(idStr);
        if (itemDiscounts[id] && itemDiscounts[id].type === 'fixed') {
            // value уже хранит скидку на одну единицу
            if (!itemDiscounts[id].value && itemDiscounts[id].valuePerItem) {
                itemDiscounts[id].value = itemDiscounts[id].valuePerItem;
            }
        }
    }
    
    // Очищаем выбранные товары
    selectedDiscountProducts.clear();
    discountProductListVisible = false;
    const container = document.getElementById('productDiscountList');
    if (container) container.style.display = 'none';
    
    updateCartUI();
    showToast(`Скидка ${type === 'percent' ? totalDiscountValue + '%' : totalDiscountValue + ' ₽'} применена на всю корзину`, true);
}
