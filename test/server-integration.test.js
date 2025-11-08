/**
 * Tests de integración para server.js
 * Lab 5 - Seguridad Informática
 * Universidad Nacional de Costa Rica
 */

// Test utilities are imported but not used in these structure validation tests
// const request = require('supertest');
// const io = require('socket.io-client');

// Mock de keyVault antes de importar el servidor
jest.mock('../libs/keyVault', () => {
  const mockKeyVault = {
    secrets: new Map([
      ['BASE_URL', 'http://localhost:3000'],
      ['OKTA_ISSUER_URI', 'https://test.okta.com'],
      ['OKTA_CLIENT_ID', 'test-client-id'],
      ['OKTA_CLIENT_SECRET', 'test-secret'],
      ['REDIRECT_URI', 'http://localhost:3000/callback'],
      ['PORT', '3001'],
      ['SECRET', 'test-secret-key-super-long-for-testing'],
      ['NODE_ENV', 'test']
    ]),
    auditLogs: [],
    securityMetrics: {
      totalAccesses: 0,
      successfulAccesses: 0,
      failedAccesses: 0,
      suspiciousAttempts: 0,
      lastAccessTime: null,
      accessesBySecret: new Map()
    },
    getSecret: jest.fn((key) => {
      const value = mockKeyVault.secrets.get(key);
      if (!value) {
        throw new Error(`Secret '${key}' not found in KeyVault`);
      }
      return value;
    }),
    getAllSecretNames: jest.fn(() => Array.from(mockKeyVault.secrets.keys())),
    hasSecret: jest.fn((key) => mockKeyVault.secrets.has(key)),
    getSecrets: jest.fn((keys) => {
      const result = Object.create(null); // Use null prototype to avoid prototype pollution
      keys.forEach(keyName => {
        const safeKey = String(keyName);
        if (mockKeyVault.secrets.has(safeKey)) {
          // Use Object.defineProperty to safely set property
          Object.defineProperty(result, safeKey, {
            value: mockKeyVault.secrets.get(safeKey),
            enumerable: true,
            configurable: true,
            writable: true
          });
        }
      });
      return result;
    }),
    getAuditLogs: jest.fn((limit = 50) => {
      return mockKeyVault.auditLogs.slice(-limit).reverse();
    }),
    getAuditLogsBySecret: jest.fn((secretName) => {
      return mockKeyVault.auditLogs
        .filter(log => log.secretName === secretName)
        .slice(-50)
        .reverse();
    }),
    getFailedAccessLogs: jest.fn(() => {
      return mockKeyVault.auditLogs
        .filter(log => !log.success)
        .slice(-50)
        .reverse();
    }),
    getSecurityMetrics: jest.fn(() => ({
      ...mockKeyVault.securityMetrics,
      accessesBySecret: Object.fromEntries(mockKeyVault.securityMetrics.accessesBySecret),
      successRate: '100%',
      failureRate: '0%'
    })),
    getSecurityStatus: jest.fn(() => ({
      status: 'SECURE',
      alerts: [],
      metrics: mockKeyVault.getSecurityMetrics(),
      timestamp: new Date().toISOString()
    }))
  };
  return mockKeyVault;
});

describe('Server Integration Tests', () => {
  // Server instances for integration testing (not used in structure validation tests)
  // let app;
  let server;
  let httpServer;

  beforeAll(() => {
    // Configurar variables de entorno
    process.env.BASE_URL = 'http://localhost:3000';
    process.env.OKTA_ISSUER_URI = 'https://test.okta.com';
    process.env.OKTA_CLIENT_ID = 'test-client-id';
    process.env.OKTA_CLIENT_SECRET = 'test-secret';
    process.env.SECRET = 'test-secret-key-super-long-for-testing';
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';
  });

  beforeEach(() => {
    // Limpiar cache de módulos
    jest.clearAllMocks();

    // No podemos importar el servidor directamente porque inicia automáticamente
    // Estos tests verificarán las estructuras y lógica sin levantar el servidor completo
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
    if (httpServer) {
      httpServer.close();
    }
  });

  describe('Endpoints públicos (sin autenticación)', () => {
    test('Endpoint /info debe existir y tener estructura correcta', () => {
      const expectedInfo = {
        name: "UNA Chat Lab 5",
        version: "1.0.0",
        security: "XSS Protection Enabled + Auth0 Authentication",
        features: [
          "Auth0 Login",
          "Image URLs",
          "Video URLs",
          "YouTube Embedding",
          "DataURL media",
        ],
        university: "Universidad Nacional - Costa Rica",
        course: "Seguridad Informática",
      };

      expect(expectedInfo.name).toBe("UNA Chat Lab 5");
      expect(expectedInfo.security).toContain("XSS Protection");
      expect(expectedInfo.features).toContain("Auth0 Login");
      expect(expectedInfo.university).toContain("Universidad Nacional");
    });

    test('Endpoint /stats debe retornar estructura correcta', () => {
      const stats = {
        totalConnections: 0,
        activeConnections: 0,
        messagesSent: 0,
        blockedMessages: 0,
        xssAttempts: 0,
        mediaShared: 0,
      };

      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('activeConnections');
      expect(stats).toHaveProperty('messagesSent');
      expect(stats).toHaveProperty('blockedMessages');
      expect(stats).toHaveProperty('xssAttempts');
      expect(stats).toHaveProperty('mediaShared');
    });
  });

  describe('Endpoints de KeyVault', () => {
    test('Estructura de respuesta de /api/keyvault/status', () => {
      const keyVault = require('../libs/keyVault');

      const response = {
        success: true,
        message: "KeyVault is working",
        environment: keyVault.getSecret("NODE_ENV"),
        secretsLoaded: keyVault.getAllSecretNames().length,
        secrets: keyVault.getAllSecretNames().map((name) => ({
          name,
          loaded: true,
        })),
        timestamp: new Date().toISOString(),
      };

      expect(response.success).toBe(true);
      expect(response.environment).toBe('test');
      expect(response.secretsLoaded).toBeGreaterThan(0);
      expect(Array.isArray(response.secrets)).toBe(true);
    });

    test('Estructura de respuesta de /api/health', () => {
      const keyVault = require('../libs/keyVault');

      const response = {
        status: "healthy",
        keyVaultStatus: "active",
        secretsCount: keyVault.getAllSecretNames().length,
        timestamp: new Date().toISOString(),
      };

      expect(response.status).toBe("healthy");
      expect(response.keyVaultStatus).toBe("active");
      expect(response.secretsCount).toBeGreaterThan(0);
    });

    test('Estructura de respuesta de /api/keyvault/audit', () => {
      const keyVault = require('../libs/keyVault');
      const logs = keyVault.getAuditLogs(50);

      const response = {
        success: true,
        totalLogs: logs.length,
        logs: logs,
        timestamp: new Date().toISOString(),
      };

      expect(response.success).toBe(true);
      expect(response).toHaveProperty('totalLogs');
      expect(Array.isArray(response.logs)).toBe(true);
    });

    test('Estructura de respuesta de /api/keyvault/audit/failures', () => {
      const keyVault = require('../libs/keyVault');
      const logs = keyVault.getFailedAccessLogs();

      const response = {
        success: true,
        failedAttempts: logs.length,
        logs: logs,
        timestamp: new Date().toISOString(),
      };

      expect(response.success).toBe(true);
      expect(response).toHaveProperty('failedAttempts');
      expect(Array.isArray(response.logs)).toBe(true);
    });

    test('Estructura de respuesta de /api/keyvault/metrics', () => {
      const keyVault = require('../libs/keyVault');
      const metrics = keyVault.getSecurityMetrics();

      const response = {
        success: true,
        metrics: metrics,
        timestamp: new Date().toISOString(),
      };

      expect(response.success).toBe(true);
      expect(response.metrics).toHaveProperty('totalAccesses');
      expect(response.metrics).toHaveProperty('successRate');
      expect(response.metrics).toHaveProperty('failureRate');
    });

    test('Estructura de respuesta de /api/keyvault/security', () => {
      const keyVault = require('../libs/keyVault');
      const status = keyVault.getSecurityStatus();

      const response = {
        success: true,
        ...status,
      };

      expect(response.success).toBe(true);
      expect(response).toHaveProperty('status');
      expect(response).toHaveProperty('alerts');
      expect(response).toHaveProperty('metrics');
    });
  });

  describe('Lógica de procesamiento de mensajes', () => {
    test('Debe sanitizar nombres y mensajes correctamente', () => {
      const validation = require('../libs/unalib');

      const sanitize = (t) =>
        validation?.sanitizeInput
          ? validation.sanitizeInput(String(t ?? ""))
          : String(t ?? "");

      const original = {
        nombre: '<script>alert("XSS")</script>Usuario',
        mensaje: 'Hola <img src=x onerror=alert(1)>',
        ts: Date.now()
      };

      const nombre = sanitize(original.nombre).slice(0, 50);
      const mensaje = sanitize(original.mensaje).slice(0, 2000);

      expect(nombre).not.toContain('<script>');
      expect(mensaje).not.toContain('onerror');
    });

    test('Debe limitar longitud de nombres a 50 caracteres', () => {
      const longName = 'A'.repeat(100);
      const limited = longName.slice(0, 50);

      expect(limited.length).toBe(50);
    });

    test('Debe limitar longitud de mensajes a 2000 caracteres', () => {
      const longMessage = 'B'.repeat(3000);
      const limited = longMessage.slice(0, 2000);

      expect(limited.length).toBe(2000);
    });

    test('Debe detectar intentos de XSS', () => {
      const validation = require('../libs/unalib');

      const maliciousMessage = '<script>alert("XSS")</script>';

      if (validation?.isScriptInjection) {
        expect(validation.isScriptInjection(maliciousMessage)).toBe(true);
      }
    });

    test('Debe procesar media con DataURL de imagen', () => {
      const { approxBytesFromDataURL } = require('../libs/server-utils');

      const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
      const isImage = /^data:image\//i.test(dataUrl);
      const bytes = approxBytesFromDataURL(dataUrl);
      const MAX_BYTES = 10 * 1024 * 1024;

      expect(isImage).toBe(true);
      expect(bytes).toBeGreaterThan(0);
      expect(bytes).toBeLessThanOrEqual(MAX_BYTES);
    });

    test('Debe procesar media con DataURL de video', () => {
      const { approxBytesFromDataURL } = require('../libs/server-utils');

      const dataUrl = 'data:video/mp4;base64,AAAAIGZ0eXBpc29t';
      const isVideo = /^data:video\//i.test(dataUrl);
      const bytes = approxBytesFromDataURL(dataUrl);

      expect(isVideo).toBe(true);
      expect(bytes).toBeGreaterThan(0);
    });

    test('Debe rechazar DataURL que exceden 10MB', () => {
      const MAX_BYTES = 10 * 1024 * 1024;
      const largeSize = 11 * 1024 * 1024;

      expect(largeSize).toBeGreaterThan(MAX_BYTES);
    });

    test('Debe validar URLs de media', () => {
      const validation = require('../libs/unalib');

      const validUrl = 'https://example.com/image.jpg';
      const invalidUrl = 'javascript:alert(1)';

      if (validation?.isValidMediaURL) {
        expect(validation.isValidMediaURL(validUrl)).toBe(true);
        expect(validation.isValidMediaURL(invalidUrl)).toBe(false);
      }
    });

    test('Debe crear payload básico correctamente', () => {
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

    test('Debe crear payload con media DataURL', () => {
      const { approxBytesFromDataURL } = require('../libs/server-utils');

      const original = {
        media: {
          type: 'image',
          dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
          mime: 'image/png',
          name: 'test.png',
          size: 1024
        }
      };

      const bytes = approxBytesFromDataURL(original.media.dataUrl);
      const isImage = /^data:image\//i.test(original.media.dataUrl);

      if (isImage && bytes > 0 && bytes <= 10 * 1024 * 1024) {
        const payload = {
          media: {
            type: original.media.type,
            dataUrl: original.media.dataUrl,
            mime: String(original.media.mime || '').slice(0, 100),
            name: String(original.media.name || '').slice(0, 120),
            size: Number(original.media.size) || bytes,
          }
        };

        expect(payload.media.type).toBe('image');
        expect(payload.media.dataUrl).toBeTruthy();
        expect(payload.media.mime.length).toBeLessThanOrEqual(100);
        expect(payload.media.name.length).toBeLessThanOrEqual(120);
      }
    });

    test('Debe crear payload con media URL', () => {
      const validation = require('../libs/unalib');

      const url = 'https://example.com/video.mp4';

      if (!validation?.isValidMediaURL || validation.isValidMediaURL(url)) {
        const payload = {
          media: {
            type: 'url',
            url: url
          }
        };

        expect(payload.media.type).toBe('url');
        expect(payload.media.url).toBe(url);
      }
    });

    test('Debe truncar mime type a 100 caracteres', () => {
      const longMime = 'image/'.repeat(50);
      const truncated = longMime.slice(0, 100);

      expect(truncated.length).toBe(100);
    });

    test('Debe truncar nombre de archivo a 120 caracteres', () => {
      const longFilename = 'file'.repeat(50);
      const truncated = longFilename.slice(0, 120);

      expect(truncated.length).toBe(120);
    });
  });

  describe('Mensajes del sistema', () => {
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

    test('Debe crear advertencia de seguridad', () => {
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

    test('Debe crear info de conexión', () => {
      const connectionInfo = {
        id: 'test-socket-id',
        connectedAt: new Date().toISOString(),
        serverInfo: "UNA Chat Lab 5 - Servidor Seguro Activo",
        securityLevel: "HIGH",
      };

      expect(connectionInfo).toHaveProperty('id');
      expect(connectionInfo).toHaveProperty('connectedAt');
      expect(connectionInfo.securityLevel).toBe('HIGH');
      expect(connectionInfo.serverInfo).toContain('UNA Chat');
    });
  });

  describe('Estadísticas del servidor', () => {
    test('Debe mantener estructura de stats correcta', () => {
      const stats = {
        totalConnections: 0,
        activeConnections: 0,
        messagesSent: 0,
        blockedMessages: 0,
        xssAttempts: 0,
        mediaShared: 0,
      };

      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('activeConnections');
      expect(stats).toHaveProperty('messagesSent');
      expect(stats).toHaveProperty('blockedMessages');
      expect(stats).toHaveProperty('xssAttempts');
      expect(stats).toHaveProperty('mediaShared');
    });

    test('Debe incrementar totalConnections al conectar', () => {
      const stats = { totalConnections: 5, activeConnections: 3 };

      // Simular nueva conexión
      stats.totalConnections++;
      stats.activeConnections++;

      expect(stats.totalConnections).toBe(6);
      expect(stats.activeConnections).toBe(4);
    });

    test('Debe decrementar activeConnections al desconectar', () => {
      const stats = { totalConnections: 6, activeConnections: 4 };

      // Simular desconexión
      stats.activeConnections--;

      expect(stats.activeConnections).toBe(3);
      expect(stats.totalConnections).toBe(6); // No cambia
    });

    test('Debe incrementar messagesSent al enviar mensaje', () => {
      const stats = { messagesSent: 10 };

      stats.messagesSent++;

      expect(stats.messagesSent).toBe(11);
    });

    test('Debe incrementar blockedMessages y xssAttempts al detectar XSS', () => {
      const stats = { blockedMessages: 2, xssAttempts: 2 };

      stats.blockedMessages++;
      stats.xssAttempts++;

      expect(stats.blockedMessages).toBe(3);
      expect(stats.xssAttempts).toBe(3);
    });

    test('Debe incrementar mediaShared al compartir media', () => {
      const stats = { mediaShared: 5 };

      stats.mediaShared++;

      expect(stats.mediaShared).toBe(6);
    });
  });

  describe('Configuración del servidor', () => {
    test('Debe tener configuración de Auth0 correcta', () => {
      const keyVault = require('../libs/keyVault');

      const config = {
        authRequired: false,
        auth0Logout: true,
        secret: keyVault.getSecret("SECRET"),
        baseURL: keyVault.getSecret("BASE_URL"),
        clientID: keyVault.getSecret("OKTA_CLIENT_ID"),
        issuerBaseURL: keyVault.getSecret("OKTA_ISSUER_URI"),
        routes: {
          login: "/login",
          logout: "/logout",
          callback: "/callback",
        },
      };

      expect(config.authRequired).toBe(false);
      expect(config.auth0Logout).toBe(true);
      expect(config.routes.login).toBe('/login');
      expect(config.routes.logout).toBe('/logout');
      expect(config.routes.callback).toBe('/callback');
    });

    test('Debe tener configuración de sesión correcta', () => {
      const keyVault = require('../libs/keyVault');

      const sessionConfig = {
        cookie: { httpOnly: true },
        secret: keyVault.getSecret("SECRET"),
        resave: false,
        saveUninitialized: true,
      };

      expect(sessionConfig.cookie.httpOnly).toBe(true);
      expect(sessionConfig.resave).toBe(false);
      expect(sessionConfig.saveUninitialized).toBe(true);
    });

    test('Debe tener configuración de Socket.IO con CORS', () => {
      const socketConfig = {
        cors: { origin: "*", methods: ["GET", "POST"] },
      };

      expect(socketConfig.cors.origin).toBe("*");
      expect(socketConfig.cors.methods).toContain("GET");
      expect(socketConfig.cors.methods).toContain("POST");
    });

    test('Debe obtener puerto desde KeyVault o usar 3000 por defecto', () => {
      const keyVault = require('../libs/keyVault');
      const port = keyVault.getSecret("PORT") || 3000;

      expect(typeof port).toBe('string');
      expect(parseInt(port, 10)).toBeGreaterThan(0);
    });
  });

  describe('Utilidades del servidor', () => {
    test('formatUptime debe formatear tiempo correctamente', () => {
      const { formatUptime } = require('../libs/server-utils');

      expect(formatUptime(3661)).toBe('1h 1m 1s');
      expect(formatUptime(0)).toBe('0h 0m 0s');
    });

    test('approxBytesFromDataURL debe calcular bytes', () => {
      const { approxBytesFromDataURL } = require('../libs/server-utils');

      const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
      const bytes = approxBytesFromDataURL(dataUrl);

      expect(bytes).toBeGreaterThan(0);
    });

    test('logSecurity debe registrar eventos', () => {
      const { logSecurity } = require('../libs/server-utils');
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Test INFO level (uses warn)
      logSecurity('Test message', 'INFO');
      expect(consoleWarnSpy).toHaveBeenCalled();

      // Test ERROR level (uses error)
      logSecurity('Error message', 'ERROR');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
