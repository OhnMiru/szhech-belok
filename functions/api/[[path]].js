// functions/api/[[path]].js

// ========== ОБРАБОТЧИК ЗАПРОСОВ ИЗОБРАЖЕНИЙ ==========
async function handleImageRequest(request) {
    const url = new URL(request.url);
    const fileId = url.searchParams.get('id');
    
    if (!fileId) {
        return new Response(JSON.stringify({ error: 'Missing file id parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
    
    console.log("🖼️ Image request for fileId:", fileId);
    
    // Прямая ссылка на скачивание с Google Drive
    const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    try {
        const response = await fetch(driveUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
            }
        });
        
        if (!response.ok) {
            console.error("Drive response not OK:", response.status);
            return new Response(JSON.stringify({ error: 'Failed to fetch from Drive' }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }
        
        const contentType = response.headers.get('Content-Type') || 'image/jpeg';
        const imageData = await response.arrayBuffer();
        
        console.log(`✅ Image fetched: ${contentType}, ${imageData.byteLength} bytes`);
        
        // Возвращаем изображение с правильными CORS заголовками
        return new Response(imageData, {
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Cache-Control': 'public, max-age=86400',
                'Cross-Origin-Resource-Policy': 'cross-origin',
                'Cross-Origin-Embedder-Policy': 'credentialless'
            }
        });
        
    } catch (error) {
        console.error("❌ Image proxy error:", error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}

// ========== ОСНОВНОЙ ОБРАБОТЧИК ==========
export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    
    console.log("📍 Request received:", request.method, url.pathname);
    
    // CORS preflight
    if (request.method === 'OPTIONS') {
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
    
    // ===== ВАЖНО: Обработка запросов изображений =====
    // Проверяем разные варианты путей
    if (url.pathname === '/image' || 
        url.pathname === '/api/image' || 
        url.pathname.startsWith('/image/') ||
        url.pathname.includes('/image')) {
        console.log("🖼️ Routing to image handler");
        return handleImageRequest(request);
    }
    
    // ===== ПРОКСИ ДЛЯ GOOGLE APPS SCRIPT =====
    const GS_API_URL = "https://script.google.com/macros/s/AKfycbwGhsekK86OnDqlIIGSiSxuAAIbH-WY-gqDvauE-i9M3LKj_2siuoy5nvejb2JNxCP9/exec";
    
    const gsUrl = new URL(GS_API_URL);
    for (const [key, value] of url.searchParams.entries()) {
        if (key !== 'route') {
            gsUrl.searchParams.append(key, value);
        }
    }
    
    try {
        const fetchOptions = {
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
        console.error("Proxy error:", error);
        return new Response(JSON.stringify({ error: 'Proxy error', details: error.message }), {
            status: 502,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}

// ========== ОБРАБОТКА OPTIONS ДЛЯ CORS ==========
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
