// functions/api/[[path]].js - упрощённая версия без прокси изображений

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    
    const GS_API_URL = "https://script.google.com/macros/s/AKfycbzY3CQq4TROQyTm6XyRtN7KJ7qknVj-3D0bbCExezNtevlTb6zEywhAhUqvWtVHEtU/exec";
    
    const gsUrl = new URL(GS_API_URL);
    for (const [key, value] of url.searchParams.entries()) {
        gsUrl.searchParams.append(key, value);
    }
    
    try {
        let fetchOptions = {
            method: request.method,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        
        if (request.method === 'POST') {
            const bodyText = await request.text();
            if (bodyText) {
                fetchOptions.body = bodyText;
            }
        }
        
        const gsResponse = await fetch(gsUrl.toString(), fetchOptions);
        const responseText = await gsResponse.text();
        
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
