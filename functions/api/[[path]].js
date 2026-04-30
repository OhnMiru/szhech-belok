// functions/api/[[path]].js

// ========== ОБРАБОТЧИК ЗАПРОСОВ ИЗОБРАЖЕНИЙ ==========
async function handleImageRequest(request) {
    const url = new URL(request.url);
    const fileId = url.searchParams.get('id');
    
    if (!fileId) {
        return new Response(JSON.stringify({ error: 'Missing file id parameter' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
    
    // Проверяем, есть ли изображение в кэше Cloudflare
    const cacheKey = new Request(`https://drive-image-cache/${fileId}`, request);
    const cache = caches.default;
    
    // Пытаемся получить из кэша
    let response = await cache.match(cacheKey);
    
    if (!response) {
        try {
            // Пробуем несколько вариантов URL Google Drive
            const driveUrls = [
                `https://drive.google.com/uc?export=download&id=${fileId}`,
                `https://drive.google.com/uc?export=view&id=${fileId}`,
                `https://drive.google.com/file/d/${fileId}/view`
            ];
            
            let imageData = null;
            let contentType = 'image/jpeg';
            
            for (const driveUrl of driveUrls) {
                try {
                    const driveResponse = await fetch(driveUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
                        }
                    });
                    
                    if (driveResponse.ok) {
                        // Проверяем, не HTML ли это (страница входа Google)
                        const contentTypeHeader = driveResponse.headers.get('Content-Type') || '';
                        
                        if (contentTypeHeader.includes('image/')) {
                            imageData = await driveResponse.arrayBuffer();
                            contentType = contentTypeHeader;
                            break;
                        } else if (contentTypeHeader.includes('text/html')) {
                            // Возможно, это страница входа, пробуем следующий URL
                            continue;
                        } else {
                            // Пробуем прочитать как изображение
                            const buffer = await driveResponse.arrayBuffer();
                            if (buffer.byteLength > 1000) { // Не пустой файл
                                imageData = buffer;
                                // Пытаемся определить тип по магии байтов
                                if (imageData.byteLength > 2) {
                                    const view = new Uint8Array(imageData);
                                    if (view[0] === 0xFF && view[1] === 0xD8) {
                                        contentType = 'image/jpeg';
                                    } else if (view[0] === 0x89 && view[1] === 0x50 && view[2] === 0x4E && view[3] === 0x47) {
                                        contentType = 'image/png';
                                    } else if (view[0] === 0x47 && view[1] === 0x49 && view[2] === 0x46) {
                                        contentType = 'image/gif';
                                    } else if (view[0] === 0x52 && view[1] === 0x49 && view[2] === 0x46 && view[3] === 0x46) {
                                        contentType = 'image/webp';
                                    }
                                }
                                break;
                            }
                        }
                    }
                } catch(e) {
                    console.error(`Error fetching from ${driveUrl}:`, e);
                }
            }
            
            if (!imageData) {
                return new Response(JSON.stringify({ error: 'Image not found or cannot be accessed' }), {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }
            
            // Создаём ответ с изображением
            response = new Response(imageData, {
                headers: {
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Cache-Control': 'public, max-age=86400', // Кэшируем на 24 часа
                    'Cross-Origin-Resource-Policy': 'cross-origin',
                    'Cross-Origin-Embedder-Policy': 'credentialless'
                }
            });
            
            // Сохраняем в кэш
            await cache.put(cacheKey, response.clone());
            
        } catch (error) {
            console.error('Image proxy error:', error);
            return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    }
    
    return response;
}

// ========== ОСНОВНОЙ ОБРАБОТЧИК ==========
export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    
    // Обработка OPTIONS запросов для CORS preflight
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
    
    // ===== ОБРАБОТКА ЗАПРОСОВ ИЗОБРАЖЕНИЙ =====
    // Если запрос к /image или /api/image
    if (url.pathname === '/image' || url.pathname === '/api/image' || url.pathname.endsWith('/image')) {
        return handleImageRequest(request);
    }
    
    // ===== ПРОКСИ ДЛЯ GOOGLE APPS SCRIPT =====
    const GS_API_URL = "https://script.google.com/macros/s/AKfycbwJLRWYUNwuT4eXdamNrFm9zC9DEsBzPV6zgnZnKuhHVISQUofk0R0hxBzucqAjVV_j/exec";
    
    // Проверяем, является ли запрос multipart/form-data (загрузка фото)
    const contentType = request.headers.get('content-type') || '';
    const isFormData = contentType.includes('multipart/form-data');
    const isPostRequest = request.method === 'POST';
    
    console.log("Proxy request:", {
        method: request.method,
        isFormData: isFormData,
        contentType: contentType,
        url: url.toString()
    });
    
    try {
        let gsResponse;
        
        if (isPostRequest && isFormData) {
            // Для загрузки фото - проксируем FormData напрямую
            console.log("Proxying FormData request to Google Apps Script");
            
            // Получаем тело запроса как FormData
            const formData = await request.formData();
            
            // Создаём новый FormData для отправки в GAS
            const gasFormData = new FormData();
            for (const [key, value] of formData.entries()) {
                gasFormData.append(key, value);
            }
            
            // Добавляем параметры из URL, если есть
            if (url.searchParams.has('action')) {
                gasFormData.append('action', url.searchParams.get('action'));
            }
            if (url.searchParams.has('participant')) {
                gasFormData.append('participant', url.searchParams.get('participant'));
            }
            
            gsResponse = await fetch(GS_API_URL, {
                method: 'POST',
                body: gasFormData
            });
        } 
        else {
            // Для обычных GET/POST запросов
            const gsUrl = new URL(GS_API_URL);
            
            // Копируем все параметры из исходного URL
            for (const [key, value] of url.searchParams.entries()) {
                // Пропускаем route параметры
                if (key !== 'route') {
                    gsUrl.searchParams.append(key, value);
                }
            }
            
            console.log("Proxying standard request to:", gsUrl.toString());
            
            const fetchOptions = {
                method: request.method,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            };
            
            // Для POST запросов с телом
            if (request.method === 'POST') {
                const bodyText = await request.text();
                if (bodyText) {
                    fetchOptions.body = bodyText;
                }
            }
            
            gsResponse = await fetch(gsUrl.toString(), fetchOptions);
        }
        
        const responseText = await gsResponse.text();
        
        // Проверяем, что ответ — JSON
        let responseBody = responseText;
        let responseContentType = 'application/json';
        
        if (responseText.trim().startsWith('<')) {
            console.error("Google Apps Script returned HTML:", responseText.substring(0, 500));
            responseBody = JSON.stringify({ 
                error: 'Google Apps Script returned HTML', 
                details: responseText.substring(0, 200) 
            });
        }
        
        // Возвращаем ответ с CORS заголовками
        return new Response(responseBody, {
            status: gsResponse.status,
            headers: {
                'Content-Type': responseContentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
        
    } catch (error) {
        console.error("Proxy error:", error);
        return new Response(JSON.stringify({ 
            error: 'Proxy error', 
            details: error.message 
        }), {
            status: 502,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// ========== ОБРАБОТКА OPTIONS ЗАПРОСОВ ДЛЯ CORS ==========
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
