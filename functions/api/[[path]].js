// functions/api/[[path]].js
// Этот файл обрабатывает все запросы, начинающиеся с /api/

// URL вашего Google Apps Script (из config.js)
const GS_API_URL = "https://script.google.com/macros/s/AKfycbwA9I9ehMqUlgATO2rIrRMI2QgVJ2Bd-lDDmizIToCa61ux5r5sxkjTvsBf2u0IKooP/exec";

export async function onRequest(context) {
    const { request, params, env } = context;
    
    // Получаем параметры запроса
    const url = new URL(request.url);
    const searchParams = new URLSearchParams(url.search);
    
    // Извлекаем оригинальные параметры (action, participant, etc.)
    const originalParams = {};
    for (const [key, value] of searchParams.entries()) {
        originalParams[key] = value;
    }
    
    // Строим URL для запроса к Google Apps Script
    const gsUrl = new URL(GS_API_URL);
    for (const [key, value] of Object.entries(originalParams)) {
        gsUrl.searchParams.append(key, value);
    }
    
    // Сохраняем метод и тело запроса
    const method = request.method;
    let body = null;
    
    if (method === 'POST') {
        try {
            body = await request.text();
        } catch (e) {
            body = null;
        }
    }
    
    // Определяем заголовки для запроса к Google Apps Script
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    
    // Выполняем запрос к Google Apps Script
    let gsResponse;
    try {
        if (method === 'POST') {
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
            JSON.stringify({ error: 'Failed to connect to backend service' }),
            {
                status: 502,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
    
    // Получаем ответ от Google Apps Script
    const responseText = await gsResponse.text();
    
    // Определяем тип содержимого
    let contentType = 'application/json';
    try {
        JSON.parse(responseText);
    } catch (e) {
        contentType = 'text/plain';
    }
    
    // Возвращаем ответ с CORS заголовками (хотя они уже не нужны на одном домене)
    return new Response(responseText, {
        status: gsResponse.status,
        headers: {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}

// Обработка OPTIONS запросов для CORS
export async function onRequestOptions() {
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
