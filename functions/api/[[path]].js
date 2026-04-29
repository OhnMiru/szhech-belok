// functions/api/[[path]].js 

// URL вашего Google Apps Script
const GS_API_URL = "https://script.google.com/macros/s/AKfycbxY14PLnxxxDKeEskGtcAZZ6hrL33IaFi7AkZLsO3NZY7hFB3Buni5nnCWrfA2-B9wa/exec";

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    
    // Получаем все параметры запроса
    const searchParams = url.searchParams;
    
    // Строим URL для Google Apps Script
    const gsUrl = new URL(GS_API_URL);
    for (const [key, value] of searchParams.entries()) {
        gsUrl.searchParams.append(key, value);
    }
    
    // Определяем метод и тело запроса
    const method = request.method;
    let body = null;
    
    if (method === 'POST') {
        try {
            body = await request.text();
        } catch (e) {
            body = null;
        }
    }
    
    // Выполняем запрос к Google Apps Script
    let gsResponse;
    try {
        if (method === 'POST') {
            gsResponse = await fetch(gsUrl.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: body
            });
        } else {
            gsResponse = await fetch(gsUrl.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
        }
    } catch (error) {
        console.error('Error fetching from Google Script:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to connect to backend service' }),
            { 
                status: 502, 
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
    
    // Получаем ответ
    const responseText = await gsResponse.text();
    
    // Проверяем, это JSON или нет
    let contentType = 'application/json';
    let responseBody = responseText;
    
    // Если ответ начинается с <, значит это HTML (ошибка от Google Script)
    if (responseText.trim().startsWith('<')) {
        contentType = 'text/plain';
        responseBody = JSON.stringify({ 
            error: 'Google Apps Script returned HTML error',
            details: responseText.substring(0, 200)
        });
    }
    
    // Возвращаем ответ
    return new Response(responseBody, {
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
