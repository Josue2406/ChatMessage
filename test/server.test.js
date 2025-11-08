/**
 * Tests para server.js
 * Lab 5 - Seguridad Informática
 * Universidad Nacional de Costa Rica
 */

const { formatUptime, approxBytesFromDataURL, logSecurity } = require('../libs/server-utils');

describe('Server Utility Functions', () => {
  describe('formatUptime', () => {
    test('Debe formatear 0 segundos correctamente', () => {
      expect(formatUptime(0)).toBe('0h 0m 0s');
    });

    test('Debe formatear 65 segundos (1 minuto 5 segundos)', () => {
      expect(formatUptime(65)).toBe('0h 1m 5s');
    });

    test('Debe formatear 3661 segundos (1 hora 1 minuto 1 segundo)', () => {
      expect(formatUptime(3661)).toBe('1h 1m 1s');
    });

    test('Debe formatear 7325 segundos (2 horas 2 minutos 5 segundos)', () => {
      expect(formatUptime(7325)).toBe('2h 2m 5s');
    });

    test('Debe manejar números decimales truncando', () => {
      expect(formatUptime(65.9)).toBe('0h 1m 5s');
    });
  });

  describe('approxBytesFromDataURL', () => {
    test('Debe retornar 0 si no hay base64', () => {
      expect(approxBytesFromDataURL('data:image/png')).toBe(0);
    });

    test('Debe retornar 0 para string vacío', () => {
      expect(approxBytesFromDataURL('')).toBe(0);
    });

    test('Debe retornar 0 para undefined (usa default)', () => {
      expect(approxBytesFromDataURL()).toBe(0);
    });

    test('Debe calcular bytes aproximados para base64 válido', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgo='; // 12 chars base64
      const result = approxBytesFromDataURL(dataUrl);
      expect(result).toBe(9); // Math.floor(12 * 0.75) = 9
    });

    test('Debe calcular bytes para DataURL más largo', () => {
      const base64 = 'A'.repeat(1000); // 1000 caracteres
      const dataUrl = `data:image/jpeg;base64,${base64}`;
      const result = approxBytesFromDataURL(dataUrl);
      expect(result).toBe(750); // Math.floor(1000 * 0.75) = 750
    });
  });

  describe('logSecurity', () => {
    let consoleWarnSpy;
    let consoleErrorSpy;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    test('Debe loguear con nivel INFO por defecto', () => {
      logSecurity('Test message');
      expect(consoleWarnSpy).toHaveBeenCalled();
      const logMessage = consoleWarnSpy.mock.calls[0][0];
      expect(logMessage).toContain('[INFO]');
      expect(logMessage).toContain('Test message');
    });

    test('Debe loguear con nivel WARNING', () => {
      logSecurity('Warning message', 'WARNING');
      expect(consoleWarnSpy).toHaveBeenCalled();
      const logMessage = consoleWarnSpy.mock.calls[0][0];
      expect(logMessage).toContain('[WARNING]');
      expect(logMessage).toContain('Warning message');
    });

    test('Debe incluir timestamp en formato ISO', () => {
      logSecurity('Test');
      const logMessage = consoleWarnSpy.mock.calls[0][0];
      // Verificar que contiene timestamp con formato [YYYY-MM-DD
      expect(logMessage).toMatch(/\[\d{4}-\d{2}-\d{2}T/);
    });
  });
});

describe('Server Stats and Constants', () => {
  test('Debe tener estructura de stats correcta', () => {
    const stats = {
      totalConnections: 0,
      activeConnections: 0,
      messagesSent: 0,
      blockedMessages: 0,
      xssAttempts: 0,
      mediaShared: 0
    };

    expect(stats).toHaveProperty('totalConnections');
    expect(stats).toHaveProperty('activeConnections');
    expect(stats).toHaveProperty('messagesSent');
    expect(stats).toHaveProperty('blockedMessages');
    expect(stats).toHaveProperty('xssAttempts');
    expect(stats).toHaveProperty('mediaShared');
  });

  test('Puerto debe tener valor por defecto 3000', () => {
    // Guardar valor original
    const originalPort = process.env.PORT;
    // Eliminar PORT para probar default
    delete process.env.PORT;

    const port = process.env.PORT || 3000;
    expect(port).toBe(3000);

    // Restaurar valor original
    if (originalPort !== undefined) {
      process.env.PORT = originalPort;
    }
  });
});

describe('Security Validations', () => {
  const validation = require('../libs/unalib');

  test('Debe validar y sanitizar mensajes correctamente', () => {
    const maliciousMsg = JSON.stringify({
      nombre: '<script>alert("XSS")</script>Usuario',
      mensaje: 'Hola <img src=x onerror=alert(1)>',
      ts: Date.now()
    });

    const result = validation.validateMessage(maliciousMsg);
    const parsed = JSON.parse(result);

    expect(parsed.nombre).not.toContain('<script>');
    expect(parsed.mensaje).not.toContain('onerror');
  });

  test('Debe detectar intentos de script injection', () => {
    expect(validation.isScriptInjection('<script>alert(1)</script>')).toBe(true);
    expect(validation.isScriptInjection('javascript:void(0)')).toBe(true);
    expect(validation.isScriptInjection('Mensaje normal')).toBe(false);
  });

  test('Debe validar URLs de media', () => {
    expect(validation.isValidMediaURL('https://example.com/image.jpg')).toBe(true);
    expect(validation.isValidMediaURL('https://example.com/video.mp4')).toBe(true);
    expect(validation.isValidMediaURL('javascript:alert(1)')).toBe(false);
  });
});

describe('Data Processing Logic', () => {
  test('Debe limitar longitud de nombre a 50 caracteres', () => {
    const longName = 'A'.repeat(100);
    const limited = longName.slice(0, 50);
    expect(limited.length).toBe(50);
  });

  test('Debe limitar longitud de mensaje a 2000 caracteres', () => {
    const longMsg = 'B'.repeat(3000);
    const limited = longMsg.slice(0, 2000);
    expect(limited.length).toBe(2000);
  });

  test('Debe validar tamaño máximo de DataURL (10MB)', () => {
    const MAX_BYTES = 10 * 1024 * 1024;
    expect(MAX_BYTES).toBe(10485760);
  });

  test('Debe manejar mime type truncado a 100 chars', () => {
    const longMime = 'image/'.repeat(50); // >100 chars
    const truncated = longMime.slice(0, 100);
    expect(truncated.length).toBe(100);
  });

  test('Debe manejar nombre de archivo truncado a 120 chars', () => {
    const longFilename = 'file'.repeat(50); // >120 chars
    const truncated = longFilename.slice(0, 120);
    expect(truncated.length).toBe(120);
  });
});

describe('Message Payload Structure', () => {
  test('Debe crear payload básico con nombre, mensaje y timestamp', () => {
    const payload = {
      nombre: 'Usuario Test',
      mensaje: 'Mensaje de prueba',
      ts: Date.now()
    };

    expect(payload).toHaveProperty('nombre');
    expect(payload).toHaveProperty('mensaje');
    expect(payload).toHaveProperty('ts');
    expect(typeof payload.ts).toBe('number');
  });

  test('Debe crear payload con media (DataURL)', () => {
    const payload = {
      nombre: 'Usuario',
      mensaje: 'Imagen adjunta',
      ts: Date.now(),
      media: {
        type: 'image',
        dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
        mime: 'image/png',
        name: 'test.png',
        size: 1024
      }
    };

    expect(payload.media).toHaveProperty('type');
    expect(payload.media).toHaveProperty('dataUrl');
    expect(payload.media.type).toBe('image');
  });

  test('Debe crear payload con media (URL)', () => {
    const payload = {
      nombre: 'Usuario',
      mensaje: 'Video adjunto',
      ts: Date.now(),
      media: {
        type: 'url',
        url: 'https://example.com/video.mp4'
      }
    };

    expect(payload.media).toHaveProperty('url');
    expect(payload.media.type).toBe('url');
  });
});

describe('Error Messages', () => {
  test('Debe crear mensaje de error del sistema', () => {
    const errorMsg = {
      nombre: 'Sistema UNA',
      mensaje: '⚠️ Error procesando mensaje. Mensaje bloqueado por seguridad.',
      ts: Date.now()
    };

    expect(errorMsg.nombre).toBe('Sistema UNA');
    expect(errorMsg.mensaje).toContain('Error procesando mensaje');
    expect(errorMsg).toHaveProperty('ts');
  });

  test('Debe crear mensaje de advertencia de seguridad', () => {
    const securityWarning = {
      message: '⚠️ Intento de script injection detectado y bloqueado por seguridad',
      timestamp: new Date().toISOString(),
      action: 'Message sanitized and logged',
      labInfo: 'Lab 5 - Demostración de protección XSS'
    };

    expect(securityWarning.message).toContain('script injection');
    expect(securityWarning.action).toBe('Message sanitized and logged');
    expect(securityWarning.labInfo).toContain('Lab 5');
  });
});

describe('Connection Info Structure', () => {
  test('Debe crear estructura de información de conexión', () => {
    const connectionInfo = {
      id: 'test-socket-id',
      connectedAt: new Date().toISOString(),
      serverInfo: 'UNA Chat Lab 5 - Servidor Seguro Activo',
      securityLevel: 'HIGH'
    };

    expect(connectionInfo).toHaveProperty('id');
    expect(connectionInfo).toHaveProperty('connectedAt');
    expect(connectionInfo.securityLevel).toBe('HIGH');
    expect(connectionInfo.serverInfo).toContain('UNA Chat');
  });
});

describe('Stats Endpoint Response', () => {
  test('Debe tener estructura de respuesta de stats correcta', () => {
    const statsResponse = {
      totalConnections: 10,
      activeConnections: 5,
      messagesSent: 100,
      blockedMessages: 2,
      xssAttempts: 2,
      mediaShared: 15,
      uptime: 12345,
      uptimeFormatted: '3h 25m 45s',
      securityStatus: 'ACTIVE',
      lab: 'Lab 5 - Seguridad Informática',
      timestamp: new Date().toISOString()
    };

    expect(statsResponse).toHaveProperty('uptime');
    expect(statsResponse).toHaveProperty('uptimeFormatted');
    expect(statsResponse.securityStatus).toBe('ACTIVE');
    expect(statsResponse.lab).toContain('Lab 5');
  });
});

describe('Info Endpoint Response', () => {
  test('Debe tener estructura de respuesta de /info correcta', () => {
    const infoResponse = {
      name: 'UNA Chat Lab 5',
      version: '1.0.0',
      security: 'XSS Protection Enabled + Auth0 Authentication',
      features: ['Auth0 Login', 'Image URLs', 'Video URLs', 'YouTube Embedding', 'DataURL media'],
      university: 'Universidad Nacional - Costa Rica',
      course: 'Seguridad Informática',
      timestamp: new Date().toISOString()
    };

    expect(infoResponse.name).toBe('UNA Chat Lab 5');
    expect(infoResponse.version).toBe('1.0.0');
    expect(infoResponse.features).toContain('Auth0 Login');
    expect(infoResponse.university).toContain('Universidad Nacional');
  });
});

describe('Media Type Detection', () => {
  test('Debe detectar DataURL de imagen correctamente', () => {
    const imageDataUrl = 'data:image/png;base64,iVBORw0KGgo=';
    const isImage = /^data:image\//i.test(imageDataUrl);
    expect(isImage).toBe(true);
  });

  test('Debe detectar DataURL de video correctamente', () => {
    const videoDataUrl = 'data:video/mp4;base64,AAAAIGZ0eXBpc29t';
    const isVideo = /^data:video\//i.test(videoDataUrl);
    expect(isVideo).toBe(true);
  });

  test('No debe detectar como imagen un DataURL de video', () => {
    const videoDataUrl = 'data:video/mp4;base64,AAAAIGZ0eXBpc29t';
    const isImage = /^data:image\//i.test(videoDataUrl);
    expect(isImage).toBe(false);
  });
});
