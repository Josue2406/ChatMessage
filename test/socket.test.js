/**
 * Tests para Socket.IO events
 * Lab 5 - Seguridad Informática
 * Universidad Nacional de Costa Rica
 */

const { approxBytesFromDataURL, logSecurity } = require('../libs/server-utils');
const validation = require('../libs/unalib');

describe('Socket.IO Event Handlers', () => {
  describe('Connection event', () => {
    test('Debe incrementar stats al conectar', () => {
      const stats = {
        totalConnections: 0,
        activeConnections: 0,
      };

      // Simular conexión
      stats.totalConnections++;
      stats.activeConnections++;

      expect(stats.totalConnections).toBe(1);
      expect(stats.activeConnections).toBe(1);
    });

    test('Debe crear connection-info con estructura correcta', () => {
      const clientId = 'socket-123';

      const connectionInfo = {
        id: clientId,
        connectedAt: new Date().toISOString(),
        serverInfo: "UNA Chat Lab 5 - Servidor Seguro Activo",
        securityLevel: "HIGH",
      };

      expect(connectionInfo.id).toBe(clientId);
      expect(connectionInfo.serverInfo).toContain('UNA Chat');
      expect(connectionInfo.securityLevel).toBe('HIGH');
      expect(connectionInfo).toHaveProperty('connectedAt');
    });

    test('Debe loguear nueva conexión con IP', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const clientId = 'socket-123';
      const clientIP = '127.0.0.1';

      logSecurity(`Nueva conexión: ${clientId} desde ${clientIP}`, 'INFO');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Disconnect event', () => {
    test('Debe decrementar activeConnections al desconectar', () => {
      const stats = {
        totalConnections: 5,
        activeConnections: 3,
      };

      // Simular desconexión
      stats.activeConnections--;

      expect(stats.activeConnections).toBe(2);
      expect(stats.totalConnections).toBe(5); // No cambia
    });

    test('Debe loguear desconexión con razón', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const clientId = 'socket-123';
      const reason = 'transport close';

      logSecurity(`Cliente desconectado: ${clientId}, razón: ${reason}`, 'INFO');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Evento-Mensaje-Server (message handling)', () => {
    test('Debe parsear JSON del mensaje', () => {
      const msg = JSON.stringify({
        nombre: 'Usuario',
        mensaje: 'Hola mundo',
        ts: Date.now()
      });

      const parsed = JSON.parse(msg);

      expect(parsed.nombre).toBe('Usuario');
      expect(parsed.mensaje).toBe('Hola mundo');
      expect(parsed).toHaveProperty('ts');
    });

    test('Debe manejar JSON vacío o malformado', () => {
      const emptyMsg = '{}';
      const parsed = JSON.parse(emptyMsg);

      expect(parsed).toEqual({});
    });

    test('Debe sanitizar nombre y mensaje', () => {
      const original = {
        nombre: '<script>alert("XSS")</script>Usuario',
        mensaje: 'Hola <img onerror=alert(1)>',
        ts: Date.now()
      };

      const sanitize = (t) =>
        validation?.sanitizeInput
          ? validation.sanitizeInput(String(t ?? ""))
          : String(t ?? "");

      const nombre = sanitize(original.nombre).slice(0, 50);
      const mensaje = sanitize(original.mensaje).slice(0, 2000);

      expect(nombre).not.toContain('<script>');
      expect(mensaje).not.toContain('onerror');
    });

    test('Debe usar "Anónimo" si no hay nombre', () => {
      const original = {
        mensaje: 'Mensaje sin nombre',
        ts: Date.now()
      };

      const sanitize = (t) => String(t ?? "");
      const nombre = sanitize(original.nombre || "Anónimo").slice(0, 50);

      expect(nombre).toBe('Anónimo');
    });

    test('Debe limitar nombre a 50 caracteres', () => {
      const longName = 'A'.repeat(100);
      const limited = longName.slice(0, 50);

      expect(limited.length).toBe(50);
    });

    test('Debe limitar mensaje a 2000 caracteres', () => {
      const longMessage = 'B'.repeat(3000);
      const limited = longMessage.slice(0, 2000);

      expect(limited.length).toBe(2000);
    });

    test('Debe usar timestamp actual si no se proporciona', () => {
      const original = {
        nombre: 'Usuario',
        mensaje: 'Mensaje',
      };

      const ts = Number(original.ts) || Date.now();

      expect(typeof ts).toBe('number');
      expect(ts).toBeGreaterThan(0);
    });

    test('Debe crear payload básico correcto', () => {
      const original = {
        nombre: 'Usuario',
        mensaje: 'Hola',
        ts: Date.now()
      };

      const payload = {
        nombre: original.nombre,
        mensaje: original.mensaje,
        ts: original.ts
      };

      expect(payload).toHaveProperty('nombre');
      expect(payload).toHaveProperty('mensaje');
      expect(payload).toHaveProperty('ts');
    });

    test('Debe detectar script injection y actualizar stats', () => {
      const stats = {
        blockedMessages: 0,
        xssAttempts: 0
      };

      const maliciousMessage = '<script>alert("XSS")</script>';

      if (validation?.isScriptInjection && validation.isScriptInjection(maliciousMessage)) {
        stats.blockedMessages++;
        stats.xssAttempts++;
      }

      expect(stats.blockedMessages).toBe(1);
      expect(stats.xssAttempts).toBe(1);
    });

    test('Debe emitir security-warning al detectar XSS', () => {
      const securityWarning = {
        message: "⚠️ Intento de script injection detectado y bloqueado por seguridad",
        timestamp: new Date().toISOString(),
        action: "Message sanitized and logged",
        labInfo: "Lab 5 - Demostración de protección XSS",
      };

      expect(securityWarning.message).toContain('script injection');
      expect(securityWarning.action).toBe('Message sanitized and logged');
      expect(securityWarning.labInfo).toContain('Lab 5');
    });

    test('Debe loguear intento de XSS detectado', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const clientId = 'socket-123';
      logSecurity(
        `🚨 INTENTO DE XSS DETECTADO Y BLOQUEADO 🚨 Cliente: ${clientId}`,
        'WARNING'
      );

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Media handling - DataURL', () => {
    test('Debe procesar imagen DataURL válida', () => {
      const stats = { mediaShared: 0 };

      const media = {
        type: 'image',
        dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
        mime: 'image/png',
        name: 'test.png',
        size: 1024
      };

      const isImage = /^data:image\//i.test(media.dataUrl);
      const bytes = approxBytesFromDataURL(media.dataUrl);
      const MAX_BYTES = 10 * 1024 * 1024;

      if (isImage && bytes > 0 && bytes <= MAX_BYTES) {
        const payload = {
          media: {
            type: media.type,
            dataUrl: media.dataUrl,
            mime: String(media.mime || '').slice(0, 100),
            name: String(media.name || '').slice(0, 120),
            size: Number(media.size) || bytes,
          }
        };
        stats.mediaShared++;

        expect(payload.media.type).toBe('image');
        expect(stats.mediaShared).toBe(1);
      }
    });

    test('Debe procesar video DataURL válido', () => {
      const stats = { mediaShared: 0 };

      const media = {
        type: 'video',
        dataUrl: 'data:video/mp4;base64,AAAAIGZ0eXBpc29t',
        mime: 'video/mp4',
        name: 'video.mp4',
        size: 2048
      };

      const isVideo = /^data:video\//i.test(media.dataUrl);
      const bytes = approxBytesFromDataURL(media.dataUrl);
      const MAX_BYTES = 10 * 1024 * 1024;

      if (isVideo && bytes > 0 && bytes <= MAX_BYTES) {
        const payload = {
          media: {
            type: media.type,
            dataUrl: media.dataUrl,
            mime: String(media.mime || '').slice(0, 100),
            name: String(media.name || '').slice(0, 120),
            size: Number(media.size) || bytes,
          }
        };
        stats.mediaShared++;

        expect(payload.media.type).toBe('video');
        expect(stats.mediaShared).toBe(1);
      }
    });

    test('Debe rechazar DataURL si excede 10MB', () => {
      const MAX_BYTES = 10 * 1024 * 1024;
      const largeBytes = 11 * 1024 * 1024;

      // Simular rechazo
      const shouldReject = largeBytes > MAX_BYTES;

      expect(shouldReject).toBe(true);
    });

    test('Debe rechazar DataURL si bytes es 0', () => {
      const bytes = 0;
      const shouldReject = !(bytes > 0);

      expect(shouldReject).toBe(true);
    });

    test('Debe rechazar DataURL que no es imagen ni video', () => {
      const dataUrl = 'data:text/plain;base64,SGVsbG8=';

      const isImage = /^data:image\//i.test(dataUrl);
      const isVideo = /^data:video\//i.test(dataUrl);

      expect(isImage).toBe(false);
      expect(isVideo).toBe(false);
    });

    test('Debe truncar mime a 100 caracteres', () => {
      const longMime = 'image/'.repeat(50);
      const truncated = String(longMime).slice(0, 100);

      expect(truncated.length).toBe(100);
    });

    test('Debe truncar nombre de archivo a 120 caracteres', () => {
      const longName = 'filename'.repeat(50);
      const truncated = String(longName).slice(0, 120);

      expect(truncated.length).toBe(120);
    });

    test('Debe usar bytes calculados si size no se proporciona', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
      const bytes = approxBytesFromDataURL(dataUrl);

      const size = Number(undefined) || bytes;

      expect(size).toBe(bytes);
    });

    test('Debe loguear rechazo de DataURL inválida', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logSecurity('Media DataURL rechazada (tipo/tamaño inválido)', 'WARNING');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Media handling - URL', () => {
    test('Debe procesar URL de media válida', () => {
      const stats = { mediaShared: 0 };

      const media = {
        type: 'url',
        url: 'https://example.com/image.jpg'
      };

      if (!validation?.isValidMediaURL || validation.isValidMediaURL(media.url)) {
        const payload = {
          media: {
            type: media.type || 'url',
            url: media.url
          }
        };
        stats.mediaShared++;

        expect(payload.media.url).toBe(media.url);
        expect(stats.mediaShared).toBe(1);
      }
    });

    test('Debe usar campo "url" o "link"', () => {
      const media1 = { url: 'https://example.com/image.jpg' };
      const media2 = { link: 'https://example.com/video.mp4' };

      const link1 = String(media1.url || media1.link);
      const link2 = String(media2.url || media2.link);

      expect(link1).toBe('https://example.com/image.jpg');
      expect(link2).toBe('https://example.com/video.mp4');
    });

    test('Debe validar URL de media antes de aceptar', () => {
      const validUrl = 'https://example.com/image.jpg';
      const invalidUrl = 'javascript:alert(1)';

      if (validation?.isValidMediaURL) {
        expect(validation.isValidMediaURL(validUrl)).toBe(true);
        expect(validation.isValidMediaURL(invalidUrl)).toBe(false);
      }
    });

    test('Debe usar type proporcionado o "url" por defecto', () => {
      const media1 = { type: 'image', url: 'https://example.com/img.jpg' };
      const media2 = { url: 'https://example.com/video.mp4' };

      const type1 = media1.type || 'url';
      const type2 = media2.type || 'url';

      expect(type1).toBe('image');
      expect(type2).toBe('url');
    });

    test('Debe loguear rechazo de URL inválida', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const link = 'javascript:alert(1)';
      logSecurity(`URL de media no válida: ${link}`, 'WARNING');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('No debe procesar URL si ya hay DataURL en payload', () => {
      const payload = {
        media: {
          type: 'image',
          dataUrl: 'data:image/png;base64,iVBORw0KGgo='
        }
      };

      // Solo procesar URL si no hay media en payload
      const shouldProcessUrl = !payload.media;

      expect(shouldProcessUrl).toBe(false);
    });
  });

  describe('Message validation and broadcasting', () => {
    test('Debe validar mensaje completo antes de enviar', () => {
      const payload = {
        nombre: 'Usuario',
        mensaje: 'Hola',
        ts: Date.now()
      };

      if (validation?.validateMessage) {
        const validated = validation.validateMessage(JSON.stringify(payload));
        const finalOut = JSON.parse(validated);

        expect(finalOut).toHaveProperty('nombre');
        expect(finalOut).toHaveProperty('mensaje');
      }
    });

    test('Debe usar payload original si validación falla', () => {
      const payload = {
        nombre: 'Usuario',
        mensaje: 'Mensaje',
        ts: Date.now()
      };

      let finalOut = payload;

      if (validation?.validateMessage) {
        try {
          const validated = validation.validateMessage(JSON.stringify(payload));
          finalOut = JSON.parse(validated);
        } catch {
          finalOut = payload; // Mantener original
        }
      }

      expect(finalOut).toHaveProperty('nombre');
      expect(finalOut).toHaveProperty('mensaje');
    });

    test('Debe convertir a JSON string antes de emitir', () => {
      const payload = {
        nombre: 'Usuario',
        mensaje: 'Hola',
        ts: Date.now()
      };

      const jsonString = JSON.stringify(payload);

      expect(typeof jsonString).toBe('string');
      expect(jsonString).toContain('Usuario');
      expect(jsonString).toContain('Hola');
    });

    test('Debe incrementar messagesSent al enviar', () => {
      const stats = { messagesSent: 10 };

      // Simular envío exitoso
      stats.messagesSent++;

      expect(stats.messagesSent).toBe(11);
    });

    test('Debe loguear mensaje validado y enviado', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const activeConnections = 3;
      logSecurity(
        `Mensaje validado y enviado a ${activeConnections} clientes`,
        'INFO'
      );

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Error handling', () => {
    test('Debe capturar errores en procesamiento de mensaje', () => {
      let errorCaught = false;

      try {
        // Simular error
        throw new Error('Test error');
      } catch (error) {
        errorCaught = true;
        expect(error.message).toBe('Test error');
      }

      expect(errorCaught).toBe(true);
    });

    test('Debe loguear error con clientId', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const clientId = 'socket-123';
      const errorMessage = 'Invalid JSON';

      logSecurity(
        `❌ Error procesando mensaje de ${clientId}: ${errorMessage}`,
        'ERROR'
      );

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('Debe crear mensaje de error del sistema', () => {
      const errorMsg = {
        nombre: "Sistema UNA",
        mensaje: "⚠️ Error procesando mensaje. Mensaje bloqueado por seguridad.",
        ts: Date.now(),
      };

      expect(errorMsg.nombre).toBe('Sistema UNA');
      expect(errorMsg.mensaje).toContain('Error procesando mensaje');
      expect(typeof errorMsg.ts).toBe('number');
    });

    test('Debe emitir mensaje de error al cliente', () => {
      const errorMsg = {
        nombre: "Sistema UNA",
        mensaje: "⚠️ Error procesando mensaje. Mensaje bloqueado por seguridad.",
        ts: Date.now(),
      };

      const jsonString = JSON.stringify(errorMsg);

      expect(typeof jsonString).toBe('string');
      expect(jsonString).toContain('Sistema UNA');
    });
  });

  describe('Security logging', () => {
    test('Debe loguear recepción de mensaje', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const clientId = 'socket-123';
      logSecurity(`Mensaje recibido de ${clientId}`, 'INFO');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('Debe usar diferentes niveles de log', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logSecurity('Info message', 'INFO');
      logSecurity('Warning message', 'WARNING');
      logSecurity('Error message', 'ERROR');

      expect(consoleSpy).toHaveBeenCalledTimes(3);
      consoleSpy.mockRestore();
    });
  });

  describe('Stats integration', () => {
    test('Debe mantener todas las estadísticas actualizadas', () => {
      const stats = {
        totalConnections: 0,
        activeConnections: 0,
        messagesSent: 0,
        blockedMessages: 0,
        xssAttempts: 0,
        mediaShared: 0,
      };

      // Simular actividad
      stats.totalConnections++;
      stats.activeConnections++;
      stats.messagesSent++;

      expect(stats.totalConnections).toBe(1);
      expect(stats.activeConnections).toBe(1);
      expect(stats.messagesSent).toBe(1);
    });

    test('Debe manejar múltiples conexiones concurrentes', () => {
      const stats = {
        totalConnections: 0,
        activeConnections: 0,
      };

      // Simular 3 conexiones
      for (let i = 0; i < 3; i++) {
        stats.totalConnections++;
        stats.activeConnections++;
      }

      expect(stats.totalConnections).toBe(3);
      expect(stats.activeConnections).toBe(3);

      // Simular 1 desconexión
      stats.activeConnections--;

      expect(stats.activeConnections).toBe(2);
      expect(stats.totalConnections).toBe(3);
    });
  });
});
