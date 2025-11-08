/**
 * Utilidades del Servidor
 * Lab 5 - Seguridad Informática
 * Universidad Nacional de Costa Rica
 */

/**
 * Formatea segundos a formato "Xh Ym Zs"
 * @param {number} seconds - Segundos a formatear
 * @returns {string} - Tiempo formateado
 */
function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}

/**
 * Calcula bytes aproximados desde un DataURL base64
 * @param {string} dataUrl - DataURL con base64
 * @returns {number} - Bytes aproximados
 */
function approxBytesFromDataURL(dataUrl = '') {
  const i = dataUrl.indexOf('base64,');
  if (i === -1) {
    return 0;
  }
  const b64 = dataUrl.slice(i + 7);
  return Math.floor(b64.length * 0.75);
}

/**
 * Log de seguridad con timestamp
 * @param {string} message - Mensaje a loguear
 * @param {string} level - Nivel de log (INFO, WARNING, ERROR, STATS)
 */
function logSecurity(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;

  // Use appropriate console method based on log level
  if (level === 'ERROR') {
    console.error(logMessage);
  } else if (level === 'WARNING') {
    console.warn(logMessage);
  } else {
    // For INFO and STATS, use warn as it's allowed by linting rules
    console.warn(logMessage);
  }
}

module.exports = {
  formatUptime,
  approxBytesFromDataURL,
  logSecurity
};
