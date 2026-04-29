// functions/api/[[path]].js
// Прокси для перенаправления запросов к Google Apps Script

// URL вашего Google Apps Script (обновите на актуальный)
const GS_API_URL = "https://script.google.com/macros/s/AKfycbwA9I9ehMqUlgATO2rIrRMI2QgVJ2Bd-lDDmizIToCa61ux5r5sxkjTvsBf2u0IKooP/exec";

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    
    // Получаем все параметры запроса
    const searchParams = url.searchParams;
    
    // Определяем метод
    const method = request.method;
    let body = null;
    let headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    
    // Обработка OPTIONS запросов для CORS
    if (method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            }
        });
    }
    
    // Для POST запросов читаем тело
    if (method === 'POST') {
        try {
            body = await request.text();
        } catch (e) {
            body = null;
        }
    }
    
    // Строим URL для Google Apps Script
    const gsUrl = new URL(GS_API_URL);
    
    // Для GET запросов копируем все параметры
    if (method === 'GET') {
        for (const [key, value] of searchParams.entries()) {
            gsUrl.searchParams.append(key, value);
        }
    }
    
    // Выполняем запрос к Google Apps Script
    let gsResponse;
    try {
        if (method === 'POST') {
            // Для POST запросов тело уже в body, параметры в URL не нужны
            gsResponse = await fetch(gsUrl.toString(), {
                method: 'POST',
                headers: headers,
                body: body
            });
        } else {
            gsResponse = await fetch(gsUrl.toString(), {
                method: 'GET',
                headers: headers
            });
        }
    } catch (error) {
        console.error('Error fetching from Google Script:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to connect to backend service', details: error.message }),
            { 
                status: 502, 
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        );
    }
    
    // Получаем ответ
    const responseText = await gsResponse.text();
    
    // Проверяем, это JSON или HTML (ошибка)
    let contentType = 'application/json';
    let responseBody = responseText;
    let status = gsResponse.status;
    
    // Если ответ начинается с <, значит это HTML (ошибка от Google Script)
    if (responseText.trim().startsWith('<')) {
        contentType = 'application/json';
        responseBody = JSON.stringify({ 
            error: 'Google Apps Script returned HTML error',
            details: responseText.substring(0, 500)
        });
        status = 500;
    }
    
    // Возвращаем ответ с CORS заголовками
    return new Response(responseBody, {
        status: status,
        headers: {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
