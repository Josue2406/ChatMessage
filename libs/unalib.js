// Librería UNA-LIB mejorada para Lab 5
function validateMessage(jsonMsg) {
    try {
        const msgObj = JSON.parse(jsonMsg);
        
        msgObj.nombre = sanitizeInput(msgObj.nombre || "Anónimo");
        msgObj.mensaje = processMessage(msgObj.mensaje || "");
        msgObj.color = validateColor(msgObj.color || "#000000");
        
        return JSON.stringify(msgObj);
    } catch (error) {
        console.error('Error validating message:', error);
        return JSON.stringify({
            nombre: "Sistema",
            mensaje: "Mensaje inválido",
            color: "#FF0000"
        });
    }
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return "Anónimo";
    
    return input
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim()
        .substring(0, 50) || "Anónimo";
}

function processMessage(message) {
    if (typeof message !== 'string') return "";
    
    let sanitized = sanitizeInput(message);
    
    // MEJORADA: Verificar si es URL válida de imagen o video
    if (isValidMediaURL(sanitized)) {
        return createMediaHTML(sanitized);
    }
    
    return sanitized;
}

function isValidMediaURL(url) {
    // Validar que sea una URL válida
    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(url)) return false;
    
    // MEJORADA: Más extensiones y patrones
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif)(\?.*)?$/i;
    const videoExtensions = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?.*)?$/i;
    
    // MEJORADA: Más dominios y patrones comunes
    const imageDomains = [
        /imgur\.com/i,
        /i\.imgur\.com/i,
        /images\./i,
        /photos\./i,
        /cdn\./i,
        /static\./i,
        /wikia\.nocookie\.net/i,  // ✅ Para tu ejemplo de Wikia
        /media\.tenor\.com/i,
        /i\.redd\.it/i,
        /preview\.redd\.it/i,
        /github\.com.*\.(jpg|png|gif)/i,
        /githubusercontent\.com/i,
        /discordapp\.com/i,
        /cdn\.discord/i,
        /picsum\.photos/i,
        /unsplash\.com/i,
        /pexels\.com/i,
        /pixabay\.com/i
    ];
    
    const videoDomains = [
        /youtube\.com/i,
        /youtu\.be/i,
        /vimeo\.com/i,
        /dailymotion\.com/i,
        /twitch\.tv/i,
        /streamable\.com/i
    ];
    
    // Verificar extensiones directas
    if (imageExtensions.test(url) || videoExtensions.test(url)) {
        return true;
    }
    
    // Verificar dominios conocidos
    const isImageDomain = imageDomains.some(pattern => pattern.test(url));
    const isVideoDomain = videoDomains.some(pattern => pattern.test(url));
    
    if (isImageDomain || isVideoDomain) {
        return true;
    }
    
    // NUEVA: Detectar URLs que contienen /images/, /photos/, /media/ aunque no tengan extensión
    const pathPatterns = [
        /\/images?\//i,
        /\/photos?\//i,
        /\/media\//i,
        /\/gallery\//i,
        /\/uploads?\//i,
        /\/assets?\//i,
        /\/attachments?\//i
    ];
    
    return pathPatterns.some(pattern => pattern.test(url));
}

function createMediaHTML(url) {
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif)(\?.*)?$/i;
    const videoExtensions = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?.*)?$/i;
    
    // MEJORADA: Mejor detección de imágenes
    const imageDomains = [
        /imgur\.com/i,
        /wikia\.nocookie\.net/i,  // ✅ Tu caso específico
        /images\./i,
        /photos\./i,
        /cdn\./i,
        /static\./i,
        /media\.tenor\.com/i
    ];
    
    const isImageUrl = imageExtensions.test(url) || 
                      imageDomains.some(pattern => pattern.test(url)) ||
                      /\/images?\//i.test(url) ||
                      /\/photos?\//i.test(url);
    
    if (isImageUrl) {
        return `<img src="${url}" alt="Imagen compartida" style="max-width: 300px; max-height: 200px; border-radius: 5px; cursor: pointer;" onerror="this.style.display='none'; this.nextSibling.style.display='inline';" onclick="window.open('${url}', '_blank')" /><span style="display:none; color:#888;">[Imagen no disponible: ${url}]</span>`;
    }
    
    if (videoExtensions.test(url)) {
        return `<video controls style="max-width: 300px; max-height: 200px;" onerror="this.style.display='none'; this.nextSibling.style.display='inline';"><source src="${url}" type="video/mp4">Tu navegador no soporta videos.</video><span style="display:none; color:#888;">[Video no disponible: ${url}]</span>`;
    }
    
    // YouTube y otros servicios
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = extractYouTubeId(url);
        if (videoId) {
            return `<iframe width="300" height="200" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
        }
    }
    
    // Si no se puede determinar, crear enlace seguro
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #1976d2; text-decoration: none;">🔗 Ver contenido: ${url.length > 50 ? url.substring(0, 50) + '...' : url}</a>`;
}

function extractYouTubeId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function validateColor(color) {
    const colorRegex = /^#[0-9A-F]{6}$/i;
    return colorRegex.test(color) ? color : "#000000";
}

function isScriptInjection(input) {
    const scriptPatterns = [
        /<script[^>]*>/gi,
        /javascript:/gi,
        /on\w+=/gi,
        /<iframe[^>]*>/gi,
        /<object[^>]*>/gi,
        /<embed[^>]*>/gi
    ];
    
    return scriptPatterns.some(pattern => pattern.test(input));
}

module.exports = {
    validateMessage,
    sanitizeInput,
    processMessage,
    isValidMediaURL,
    createMediaHTML,
    validateColor,
    isScriptInjection
};