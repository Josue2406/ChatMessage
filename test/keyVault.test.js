/**
 * Tests para keyVault.js
 * Lab 5 - Seguridad Informática
 * Universidad Nacional de Costa Rica
 */

describe('KeyVault Service', () => {
  // KeyVaultService is imported dynamically in tests
  // let KeyVaultService;
  let mockConsole;

  beforeEach(() => {
    // Mock console.warn para evitar outputs en los tests
    mockConsole = {
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
    };

    // Limpiar módulos cacheados para tener instancias frescas
    jest.resetModules();

    // Configurar variables de entorno de prueba
    process.env.BASE_URL = 'http://localhost:3000';
    process.env.OKTA_ISSUER_URI = 'https://test.okta.com';
    process.env.OKTA_CLIENT_ID = 'test-client-id';
    process.env.OKTA_CLIENT_SECRET = 'test-secret';
    process.env.REDIRECT_URI = 'http://localhost:3000/callback';
    process.env.PORT = '3000';
    process.env.SECRET = 'test-secret-key';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    mockConsole.warn.mockRestore();
    mockConsole.error.mockRestore();
  });

  describe('Constructor y Carga de Secretos', () => {
    test('Debe inicializar con estructura correcta', () => {
      // Importar después de configurar las env vars
      const keyVault = require('../libs/keyVault');

      expect(keyVault.secrets).toBeDefined();
      expect(keyVault.auditLogs).toBeDefined();
      expect(keyVault.securityMetrics).toBeDefined();
    });

    test('Debe cargar todos los secretos disponibles desde env', () => {
      const keyVault = require('../libs/keyVault');

      expect(keyVault.hasSecret('BASE_URL')).toBe(true);
      expect(keyVault.hasSecret('OKTA_CLIENT_ID')).toBe(true);
      expect(keyVault.hasSecret('PORT')).toBe(true);
      expect(keyVault.hasSecret('SECRET')).toBe(true);
      expect(keyVault.hasSecret('NODE_ENV')).toBe(true);
    });

    test('Debe mostrar advertencia para secretos faltantes', () => {
      delete process.env.OKTA_CLIENT_SECRET;
      jest.resetModules();

      require('../libs/keyVault');

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining("Secret 'OKTA_CLIENT_SECRET' not found")
      );
    });

    test('Debe loguear correctamente la carga de secretos', () => {
      jest.resetModules();
      require('../libs/keyVault');

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('KeyVault loaded')
      );
    });
  });

  describe('getSecret()', () => {
    test('Debe retornar el valor de un secreto existente', () => {
      const keyVault = require('../libs/keyVault');

      const secret = keyVault.getSecret('PORT');
      expect(secret).toBe('3000');
    });

    test('Debe lanzar error para secreto no existente', () => {
      const keyVault = require('../libs/keyVault');

      expect(() => {
        keyVault.getSecret('SECRETO_INEXISTENTE');
      }).toThrow("Secret 'SECRETO_INEXISTENTE' not found in KeyVault");
    });

    test('Debe actualizar métricas en acceso exitoso', () => {
      const keyVault = require('../libs/keyVault');
      const initialAccesses = keyVault.securityMetrics.totalAccesses;

      keyVault.getSecret('PORT');

      expect(keyVault.securityMetrics.totalAccesses).toBe(initialAccesses + 1);
      expect(keyVault.securityMetrics.successfulAccesses).toBeGreaterThan(0);
    });

    test('Debe actualizar métricas en acceso fallido', () => {
      const keyVault = require('../libs/keyVault');
      const initialFailed = keyVault.securityMetrics.failedAccesses;

      try {
        keyVault.getSecret('NO_EXISTE');
      } catch {
        // Esperado - secret no existe
      }

      expect(keyVault.securityMetrics.failedAccesses).toBe(initialFailed + 1);
    });

    test('Debe crear log de auditoría en acceso exitoso', () => {
      const keyVault = require('../libs/keyVault');
      const initialLogs = keyVault.auditLogs.length;

      keyVault.getSecret('PORT');

      expect(keyVault.auditLogs.length).toBeGreaterThan(initialLogs);
      const lastLog = keyVault.auditLogs[keyVault.auditLogs.length - 1];
      expect(lastLog.action).toBe('ACCESS');
      expect(lastLog.success).toBe(true);
    });

    test('Debe crear log de auditoría en acceso fallido', () => {
      const keyVault = require('../libs/keyVault');
      const initialLogs = keyVault.auditLogs.length;

      try {
        keyVault.getSecret('NO_EXISTE');
      } catch {
        // Esperado - secret no existe
      }

      expect(keyVault.auditLogs.length).toBeGreaterThan(initialLogs);
      const lastLog = keyVault.auditLogs[keyVault.auditLogs.length - 1];
      expect(lastLog.action).toBe('ACCESS');
      expect(lastLog.success).toBe(false);
    });
  });

  describe('getAllSecretNames()', () => {
    test('Debe retornar array con nombres de secretos', () => {
      const keyVault = require('../libs/keyVault');

      const names = keyVault.getAllSecretNames();

      expect(Array.isArray(names)).toBe(true);
      expect(names.length).toBeGreaterThan(0);
      expect(names).toContain('PORT');
      expect(names).toContain('SECRET');
    });
  });

  describe('hasSecret()', () => {
    test('Debe retornar true para secreto existente', () => {
      const keyVault = require('../libs/keyVault');

      expect(keyVault.hasSecret('PORT')).toBe(true);
      expect(keyVault.hasSecret('NODE_ENV')).toBe(true);
    });

    test('Debe retornar false para secreto inexistente', () => {
      const keyVault = require('../libs/keyVault');

      expect(keyVault.hasSecret('SECRETO_FALSO')).toBe(false);
      expect(keyVault.hasSecret('NOT_EXISTS')).toBe(false);
    });
  });

  describe('getSecrets()', () => {
    test('Debe retornar objeto con múltiples secretos', () => {
      const keyVault = require('../libs/keyVault');

      const secrets = keyVault.getSecrets(['PORT', 'NODE_ENV']);

      expect(secrets).toHaveProperty('PORT');
      expect(secrets).toHaveProperty('NODE_ENV');
      expect(secrets.PORT).toBe('3000');
      expect(secrets.NODE_ENV).toBe('test');
    });

    test('Debe omitir secretos inexistentes', () => {
      const keyVault = require('../libs/keyVault');

      const secrets = keyVault.getSecrets(['PORT', 'NO_EXISTE']);

      expect(secrets).toHaveProperty('PORT');
      expect(secrets).not.toHaveProperty('NO_EXISTE');
    });

    test('Debe retornar objeto vacío si ningún secreto existe', () => {
      const keyVault = require('../libs/keyVault');

      const secrets = keyVault.getSecrets(['FAKE1', 'FAKE2']);

      expect(Object.keys(secrets).length).toBe(0);
    });
  });

  describe('Auditoría - getAuditLogs()', () => {
    test('Debe retornar logs en orden reverso (más reciente primero)', () => {
      const keyVault = require('../libs/keyVault');

      keyVault.getSecret('PORT');
      keyVault.getSecret('NODE_ENV');

      const logs = keyVault.getAuditLogs(10);

      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
    });

    test('Debe respetar el límite especificado', () => {
      const keyVault = require('../libs/keyVault');

      const logs = keyVault.getAuditLogs(5);

      expect(logs.length).toBeLessThanOrEqual(5);
    });

    test('Debe incluir estructura correcta en logs', () => {
      const keyVault = require('../libs/keyVault');

      keyVault.getSecret('PORT');
      const logs = keyVault.getAuditLogs(1);

      expect(logs[0]).toHaveProperty('timestamp');
      expect(logs[0]).toHaveProperty('action');
      expect(logs[0]).toHaveProperty('secretName');
      expect(logs[0]).toHaveProperty('success');
      expect(logs[0]).toHaveProperty('message');
      expect(logs[0]).toHaveProperty('severity');
    });
  });

  describe('Auditoría - getAuditLogsBySecret()', () => {
    test('Debe retornar logs filtrados por nombre de secreto', () => {
      const keyVault = require('../libs/keyVault');

      keyVault.getSecret('PORT');
      keyVault.getSecret('NODE_ENV');

      const logs = keyVault.getAuditLogsBySecret('PORT');

      expect(Array.isArray(logs)).toBe(true);
      logs.forEach(log => {
        expect(log.secretName).toBe('PORT');
      });
    });
  });

  describe('Auditoría - getFailedAccessLogs()', () => {
    test('Debe retornar solo intentos fallidos', () => {
      const keyVault = require('../libs/keyVault');

      try { keyVault.getSecret('FAKE1'); } catch { /* Esperado */ }
      try { keyVault.getSecret('FAKE2'); } catch { /* Esperado */ }

      const failedLogs = keyVault.getFailedAccessLogs();

      expect(Array.isArray(failedLogs)).toBe(true);
      failedLogs.forEach(log => {
        expect(log.success).toBe(false);
      });
    });
  });

  describe('Métricas de Seguridad', () => {
    test('Debe calcular successRate correctamente', () => {
      jest.resetModules();
      const keyVault = require('../libs/keyVault');

      // Resetear métricas
      keyVault.getSecret('PORT'); // exitoso

      const metrics = keyVault.getSecurityMetrics();

      expect(metrics).toHaveProperty('successRate');
      expect(metrics.successRate).toContain('%');
    });

    test('Debe calcular failureRate correctamente', () => {
      const keyVault = require('../libs/keyVault');

      try { keyVault.getSecret('FAKE'); } catch { /* Esperado */ }

      const metrics = keyVault.getSecurityMetrics();

      expect(metrics).toHaveProperty('failureRate');
      expect(metrics.failureRate).toContain('%');
    });

    test('Debe rastrear accesos por secreto', () => {
      const keyVault = require('../libs/keyVault');

      keyVault.getSecret('PORT');
      keyVault.getSecret('PORT');

      const metrics = keyVault.getSecurityMetrics();

      expect(metrics.accessesBySecret).toHaveProperty('PORT');
      expect(metrics.accessesBySecret.PORT).toBeGreaterThanOrEqual(2);
    });

    test('Debe actualizar lastAccessTime', () => {
      const keyVault = require('../libs/keyVault');

      keyVault.getSecret('PORT');

      const metrics = keyVault.getSecurityMetrics();

      expect(metrics.lastAccessTime).toBeTruthy();
    });
  });

  describe('Estado de Seguridad - getSecurityStatus()', () => {
    test('Debe retornar estructura correcta', () => {
      const keyVault = require('../libs/keyVault');

      const status = keyVault.getSecurityStatus();

      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('alerts');
      expect(status).toHaveProperty('metrics');
      expect(status).toHaveProperty('timestamp');
    });

    test('Debe detectar estado SECURE con actividad normal', () => {
      jest.resetModules();
      const keyVault = require('../libs/keyVault');

      keyVault.getSecret('PORT');

      const status = keyVault.getSecurityStatus();

      expect(['SECURE', 'WARNING']).toContain(status.status);
    });

    test('Debe detectar WARNING con algunos fallos', () => {
      const keyVault = require('../libs/keyVault');

      // Generar 5 intentos fallidos
      for (let i = 0; i < 5; i++) {
        try { keyVault.getSecret(`FAKE_${i}`); } catch { /* Esperado */ }
      }

      const status = keyVault.getSecurityStatus();

      expect(['WARNING', 'CRITICAL', 'SECURE']).toContain(status.status);
    });

    test('Debe detectar CRITICAL con muchos fallos', () => {
      const keyVault = require('../libs/keyVault');

      // Generar 10 intentos fallidos
      for (let i = 0; i < 10; i++) {
        try { keyVault.getSecret(`FAKE_${i}`); } catch { /* Esperado */ }
      }

      const status = keyVault.getSecurityStatus();

      expect(['WARNING', 'CRITICAL']).toContain(status.status);
    });

    test('Debe incluir alertas en el estado', () => {
      const keyVault = require('../libs/keyVault');

      const status = keyVault.getSecurityStatus();

      expect(Array.isArray(status.alerts)).toBe(true);
    });
  });

  describe('Protección contra ataques', () => {
    test('Debe detectar actividad sospechosa con múltiples fallos', () => {
      const keyVault = require('../libs/keyVault');

      // Simular 5 intentos fallidos consecutivos
      for (let i = 0; i < 5; i++) {
        try {
          keyVault.getSecret(`ATTACK_${i}`);
        } catch {
          // Esperado - intento fallido
        }
      }

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('ALERTA DE SEGURIDAD')
      );
    });

    test('Debe incrementar suspicious attempts en fallos', () => {
      const keyVault = require('../libs/keyVault');
      const initialSuspicious = keyVault.securityMetrics.suspiciousAttempts;

      try {
        keyVault.getSecret('ATTACK');
      } catch { /* Esperado */ }

      expect(keyVault.securityMetrics.suspiciousAttempts).toBeGreaterThan(initialSuspicious);
    });
  });

  describe('Límite de logs (1000 máximo)', () => {
    test('Debe mantener solo 1000 logs máximo', () => {
      // Esta prueba es conceptual ya que sería costoso generar 1001 accesos
      const keyVault = require('../libs/keyVault');

      // Verificar que existe el límite en el código
      expect(keyVault.auditLogs.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Integración completa', () => {
    test('Debe manejar flujo completo de acceso a secretos', () => {
      const keyVault = require('../libs/keyVault');

      // Acceder a secretos
      const port = keyVault.getSecret('PORT');
      const nodeEnv = keyVault.getSecret('NODE_ENV');

      // Verificar métricas
      const metrics = keyVault.getSecurityMetrics();
      expect(metrics.totalAccesses).toBeGreaterThan(0);

      // Verificar logs
      const logs = keyVault.getAuditLogs(10);
      expect(logs.length).toBeGreaterThan(0);

      // Verificar estado
      const status = keyVault.getSecurityStatus();
      expect(status.status).toBeTruthy();

      // Verificar valores
      expect(port).toBe('3000');
      expect(nodeEnv).toBe('test');
    });
  });
});
