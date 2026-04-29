// functions/api/[[path]].js

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    
    const GS_API_URL = "https://script.google.com/macros/s/AKfycbzY3CQq4TROQyTm6XyRtN7KJ7qknVj-3D0bbCExezNtevlTb6zEywhAhUqvWtVHEtU/exec";
    
    const gsUrl = new URL(GS_API_URL);
    for (const [key, value] of url.searchParams.entries()) {
        gsUrl.searchParams.append(key, value);
    }
    
    try {
        const gsResponse = await fetch(gsUrl.toString(), {
            method: request.method,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        const responseText = await gsResponse.text();
        
        // Проверяем, что ответ — JSON
        let responseBody = responseText;
        let contentType = 'application/json';
        
        if (responseText.trim().startsWith('<')) {
            responseBody = JSON.stringify({ 
                error: 'Google Apps Script returned HTML', 
                details: responseText.substring(0, 200) 
            });
        }
        
        return new Response(responseBody, {
            status: gsResponse.status,
            headers: {
                'Content-Type': contentType,
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
