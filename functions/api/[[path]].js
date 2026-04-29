// functions/api/[[path]].js - минимальный рабочий прокси

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    
    // URL вашего Google Apps Script (работает)
    const GS_API_URL = "https://script.google.com/macros/s/AKfycbzY3CQq4TROQyTm6XyRtN7KJ7qknVj-3D0bbCExezNtevlTb6zEywhAhUqvWtVHEtU/exec";
    
    // Строим URL для Google Apps Script с теми же параметрами
    const gsUrl = new URL(GS_API_URL);
    for (const [key, value] of url.searchParams.entries()) {
        gsUrl.searchParams.append(key, value);
    }
    
    try {
        // Просто передаём запрос дальше
        const gsResponse = await fetch(gsUrl.toString(), {
            method: request.method,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        const responseText = await gsResponse.text();
        
        // Возвращаем ответ с CORS заголовками
        return new Response(responseText, {
            status: gsResponse.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: 'Proxy error', 
            details: error.message 
        }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
