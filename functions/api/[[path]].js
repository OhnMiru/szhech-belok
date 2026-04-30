// functions/api/[[path]].js - полный прокси с поддержкой фото

// ========== ОБРАБОТЧИК ЗАПРОСОВ ИЗОБРАЖЕНИЙ ==========
async function handleImageRequest(request) {
    const url = new URL(request.url);
    const fileId = url.searchParams.get('id');
    
    if (!fileId) {
        return new Response(JSON.stringify({ error: 'Missing file id' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
    
    // Прямая ссылка на скачивание с Google Drive
    const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    try {
        const response = await fetch(driveUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        // Получаем данные изображения
        const imageData = await response.arrayBuffer();
        
        // Определяем тип содержимого
        let contentType = 'image/jpeg';
        const firstBytes = new Uint8Array(imageData.slice(0, 4));
        
        // Проверяем магические числа
        if (firstBytes[0] === 0x89 && firstBytes[1] === 0x50 && firstBytes[2] === 0x4E && firstBytes[3] === 0x47) {
            contentType = 'image/png';
        } else if (firstBytes[0] === 0x47 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46) {
            contentType = 'image/gif';
        } else if (firstBytes[0] === 0x52 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46 && firstBytes[3] === 0x46) {
            contentType = 'image/webp';
        }
        
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
        console.error('Image proxy error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch image' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}

// ========== ОСНОВНОЙ ОБРАБОТЧИК ==========
export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    
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
    
    // Обработка запросов изображений
    if (url.pathname === '/image' || url.pathname === '/api/image') {
        return handleImageRequest(request);
    }
    
    // ===== ПРОКСИ ДЛЯ GOOGLE APPS SCRIPT =====
    const GS_API_URL = "https://script.google.com/macros/s/AKfycbx2FQdqjrv25bi4wJCeEqY08J4mkHnbvcyfFSxklEO3lp-MiSVhYVq63xRFaRX6Qxa6/exec";
    
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
        return new Response(JSON.stringify({ error: 'Proxy error', details: error.message }), {
            status: 502,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
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
