// libs/keyVault.js
// Sistema de gestión de secretos tipo Azure Key Vault con Auditoría y Monitoreo
// Universidad Nacional - Lab 5 Seguridad Informática

class KeyVaultService {
  constructor() {
    this.secrets = new Map();
    this.auditLogs = [];
    this.securityMetrics = {
      totalAccesses: 0,
      successfulAccesses: 0,
      failedAccesses: 0,
      suspiciousAttempts: 0,
      lastAccessTime: null,
      accessesBySecret: new Map(),
    };
    this._loadSecrets();
  }

  _loadSecrets() {
    // Lista de secretos que tu app necesita
    const secretKeys = [
      "BASE_URL",
      "OKTA_ISSUER_URI",
      "OKTA_CLIENT_ID",
      "OKTA_CLIENT_SECRET",
      "REDIRECT_URI",
      "PORT",
      "SECRET",
      "NODE_ENV",
    ];

    secretKeys.forEach((key) => {
      // eslint-disable-next-line security/detect-object-injection
      const value = process.env[key];
      if (value) {
        this.secrets.set(key, value);
        this._logAudit("LOAD", key, true, "Secret loaded successfully");
      } else {
        console.warn(`⚠️ Secret '${key}' not found in environment`);
        this._logAudit("LOAD", key, false, "Secret not found in environment");
      }
    });

    console.warn(`✅ KeyVault loaded ${this.secrets.size} secrets`);
  }

  _logAudit(action, secretName, success, message) {
    const log = {
      timestamp: new Date().toISOString(),
      action,
      secretName,
      success,
      message,
      severity: success ? "INFO" : "WARNING",
    };

    this.auditLogs.push(log);

    // Mantener solo los últimos 1000 logs para no consumir mucha memoria
    if (this.auditLogs.length > 1000) {
      this.auditLogs.shift();
    }

    // Formatear para consola
    const icon = success ? "✅" : "⚠️";
    const timestamp = new Date().toISOString();
    console.warn(
      `[${timestamp}] ${icon} KeyVault ${action}: '${secretName}' - ${message}`
    );
  }

  _updateSecurityMetrics(secretName, success) {
    this.securityMetrics.totalAccesses++;
    this.securityMetrics.lastAccessTime = new Date().toISOString();

    if (success) {
      this.securityMetrics.successfulAccesses++;

      // Rastrear accesos por secreto
      const count = this.securityMetrics.accessesBySecret.get(secretName) || 0;
      this.securityMetrics.accessesBySecret.set(secretName, count + 1);
    } else {
      this.securityMetrics.failedAccesses++;
      this.securityMetrics.suspiciousAttempts++;
    }
  }

  _checkSuspiciousActivity() {
    const recentLogs = this.auditLogs.slice(-10);
    const failedAttempts = recentLogs.filter((log) => !log.success).length;

    if (failedAttempts >= 5) {
      console.warn(
        `🚨 ALERTA DE SEGURIDAD: ${failedAttempts} intentos fallidos en los últimos 10 accesos`
      );
      return true;
    }
    return false;
  }

  getSecret(secretName) {
    const secret = this.secrets.get(secretName);

    if (!secret) {
      this._logAudit(
        "ACCESS",
        secretName,
        false,
        "Secret not found - Access denied"
      );
      this._updateSecurityMetrics(secretName, false);
      this._checkSuspiciousActivity();
      throw new Error(`Secret '${secretName}' not found in KeyVault`);
    }

    this._logAudit("ACCESS", secretName, true, "Secret accessed successfully");
    this._updateSecurityMetrics(secretName, true);
    return secret;
  }

  getAllSecretNames() {
    return Array.from(this.secrets.keys());
  }

  hasSecret(secretName) {
    return this.secrets.has(secretName);
  }

  getSecrets(secretNames) {
    const result = {};
    secretNames.forEach((name) => {
      if (this.hasSecret(name)) {
        // eslint-disable-next-line security/detect-object-injection
        result[name] = this.getSecret(name);
      }
    });
    return result;
  }

  // Métodos de Auditoría
  getAuditLogs(limit = 50) {
    return this.auditLogs.slice(-limit).reverse();
  }

  getAuditLogsBySecret(secretName) {
    return this.auditLogs
      .filter((log) => log.secretName === secretName)
      .slice(-50)
      .reverse();
  }

  getFailedAccessLogs() {
    return this.auditLogs
      .filter((log) => !log.success)
      .slice(-50)
      .reverse();
  }

  // Métodos de Monitoreo de Seguridad
  getSecurityMetrics() {
    return {
      ...this.securityMetrics,
      accessesBySecret: Object.fromEntries(
        this.securityMetrics.accessesBySecret
      ),
      successRate:
        this.securityMetrics.totalAccesses > 0
          ? (
              (this.securityMetrics.successfulAccesses /
                this.securityMetrics.totalAccesses) *
              100
            ).toFixed(2) + "%"
          : "0%",
      failureRate:
        this.securityMetrics.totalAccesses > 0
          ? (
              (this.securityMetrics.failedAccesses /
                this.securityMetrics.totalAccesses) *
              100
            ).toFixed(2) + "%"
          : "0%",
    };
  }

  getSecurityStatus() {
    const metrics = this.getSecurityMetrics();
    const recentFailures = this.auditLogs
      .slice(-20)
      .filter((log) => !log.success).length;

    let status = "SECURE";
    const alerts = [];

    if (recentFailures >= 10) {
      status = "CRITICAL";
      alerts.push("⚠️ Alto número de intentos fallidos detectados");
    } else if (recentFailures >= 5) {
      status = "WARNING";
      alerts.push("⚠️ Actividad sospechosa detectada");
    }

    if (this.secrets.size < 8) {
      status = status === "SECURE" ? "WARNING" : status;
      alerts.push(`⚠️ Solo ${this.secrets.size}/8 secretos cargados`);
    }

    return {
      status,
      alerts,
      metrics,
      timestamp: new Date().toISOString(),
    };
  }
}

// Exportar instancia singleton
const keyVault = new KeyVaultService();
module.exports = keyVault;
