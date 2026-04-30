// functions/api/[[path]].js

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    
    const GS_API_URL = "https://script.google.com/macros/s/AKfycbz3O0-XHI0bP5yevLA16bHnGMu-LfWkNI9-cOewybdTgAw95trtj0xCMxOgpRPy8k1i/exec";
    
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
                gsUrl.searchParams.append(key, value);
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
