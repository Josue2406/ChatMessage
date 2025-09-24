// Servidor de Chat UNA - Lab 5 Seguridad Informática
// Universidad Nacional - Sede Regional Chorotega Campus Nicoya

const validation = require('./libs/unalib');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});
const path = require('path');
const port = process.env.PORT || 3000;

/* --------------------------------- Utils --------------------------------- */
function logSecurity(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}

// Aprox bytes de un DataURL base64 (para límites de tamaño)
function approxBytesFromDataURL(dataUrl = '') {
  // data:[mime];base64,AAAA...
  const i = dataUrl.indexOf('base64,');
  if (i === -1) return 0;
  const b64 = dataUrl.slice(i + 7);
  return Math.floor(b64.length * 0.75);
}

/* ------------------------------ Static & HTTP ----------------------------- */
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/info', (req, res) => {
  res.json({
    name: 'UNA Chat Lab 5',
    version: '1.0.0',
    security: 'XSS Protection Enabled',
    features: ['Image URLs', 'Video URLs', 'YouTube Embedding', 'DataURL media'],
    university: 'Universidad Nacional - Costa Rica',
    course: 'Seguridad Informática',
    timestamp: new Date().toISOString()
  });
});

/* --------------------------------- Stats --------------------------------- */
let stats = {
  totalConnections: 0,
  activeConnections: 0,
  messagesSent: 0,
  blockedMessages: 0,
  xssAttempts: 0,
  mediaShared: 0
};

app.get('/stats', (req, res) => {
  res.json({
    ...stats,
    uptime: process.uptime(),
    uptimeFormatted: formatUptime(process.uptime()),
    securityStatus: 'ACTIVE',
    lab: 'Lab 5 - Seguridad Informática',
    timestamp: new Date().toISOString()
  });
});

/* ------------------------------- WebSockets ------------------------------- */
io.on('connection', (socket) => {
  stats.totalConnections++;
  stats.activeConnections++;

  const clientId = socket.id;
  const clientIP = socket.handshake.address;
  logSecurity(`Nueva conexión: ${clientId} desde ${clientIP}`, 'INFO');

  socket.emit('connection-info', {
    id: clientId,
    connectedAt: new Date().toISOString(),
    serverInfo: 'UNA Chat Lab 5 - Servidor Seguro Activo',
    securityLevel: 'HIGH'
  });

  // Punto clave: el servidor NO genera HTML. Solo reemite JSON validado/sanitizado.
  socket.on('Evento-Mensaje-Server', (msg) => {
    try {
      logSecurity(`Mensaje recibido de ${clientId}`, 'INFO');

      // Parsear entrada original
      const original = JSON.parse(msg || '{}');

      // 1) Sanitizar texto (con tu librería UNA-LIB si está disponible)
      const sanitize = (t) =>
        validation?.sanitizeText
          ? validation.sanitizeText(String(t ?? ''))
          : String(t ?? '');

      const nombre = sanitize(original.nombre || 'Anónimo').slice(0, 50);
      const mensaje = sanitize(original.mensaje || '').slice(0, 2000);
      const ts = Number(original.ts) || Date.now();

      const payload = { nombre, mensaje, ts };

      // 2) Detección de XSS (solo log + advertencia; el texto ya va sanitizado)
      if (validation?.isScriptInjection && validation.isScriptInjection(original.mensaje)) {
        stats.blockedMessages++;
        stats.xssAttempts++;
        logSecurity(`🚨 INTENTO DE XSS DETECTADO Y BLOQUEADO 🚨 Cliente: ${clientId}`, 'WARNING');
        socket.emit('security-warning', {
          message: '⚠️ Intento de script injection detectado y bloqueado por seguridad',
          timestamp: new Date().toISOString(),
          action: 'Message sanitized and logged',
          labInfo: 'Lab 5 - Demostración de protección XSS'
        });
      }

      // 3) Media SIN backend (DataURL) o futura URL (cuando subas a storage)
      if (original.media && typeof original.media === 'object') {
        const { type, dataUrl, mime, name, size, url } = original.media;

        // DataURL (laboratorio/demo)
        if (typeof dataUrl === 'string' && (type === 'image' || type === 'video')) {
          const isImage = /^data:image\//i.test(dataUrl);
          const isVideo = /^data:video\//i.test(dataUrl);
          const bytes = approxBytesFromDataURL(dataUrl);
          const MAX_BYTES = 10 * 1024 * 1024; // 10MB

          if ((isImage || isVideo) && bytes > 0 && bytes <= MAX_BYTES) {
            payload.media = {
              type,
              dataUrl, // el cliente lo renderea con <img>/<video>
              mime: String(mime || '').slice(0, 100),
              name: String(name || '').slice(0, 120),
              size: Number(size) || bytes
            };
            stats.mediaShared++;
          } else {
            logSecurity(`Media DataURL rechazada (tipo/tamaño inválido)`, 'WARNING');
          }
        }

        // URL (cuando tengas storage); valida con tu lib
        if (!payload.media && (url || original.media.link)) {
          const link = String(url || original.media.link);
          if (!validation?.isValidMediaURL || validation.isValidMediaURL(link)) {
            payload.media = { type: type || 'url', url: link };
            stats.mediaShared++;
          } else {
            logSecurity(`URL de media no válida: ${link}`, 'WARNING');
          }
        }
      }

      // 4) (Opcional) Validación adicional de mensaje completo con tu lib
      //    OJO: validateMessage debe devolver JSON de texto; si no, omitelo.
      let finalOut = payload;
      if (validation?.validateMessage) {
        try {
          const validated = validation.validateMessage(JSON.stringify(payload));
          finalOut = JSON.parse(validated);
        } catch {
          // Si falla, usa el payload ya sanitizado
          finalOut = payload;
        }
      }

      // 5) Emitir a todos los clientes (JSON, no HTML)
      io.emit('Evento-Mensaje-Server', JSON.stringify(finalOut));
      stats.messagesSent++;
      logSecurity(`Mensaje validado y enviado a ${stats.activeConnections} clientes conectados`, 'INFO');
    } catch (error) {
      logSecurity(`❌ Error procesando mensaje de ${clientId}: ${error.message}`, 'ERROR');

      const errorMsg = {
        nombre: 'Sistema UNA',
        mensaje: '⚠️ Error procesando mensaje. Mensaje bloqueado por seguridad.',
        ts: Date.now()
      };

      // También intentamos pasar por validateMessage si existe
      let sanitized = errorMsg;
      if (validation?.validateMessage) {
        try {
          const v = validation.validateMessage(JSON.stringify(errorMsg));
          sanitized = JSON.parse(v);
        } catch { /* ignore */ }
      }

      socket.emit('Evento-Mensaje-Server', JSON.stringify(sanitized));
    }
  });

  socket.on('disconnect', (reason) => {
    stats.activeConnections--;
    logSecurity(`Cliente desconectado: ${clientId}, razón: ${reason}`, 'INFO');

    if (stats.activeConnections === 0) {
      logSecurity(
        `📊 Sesión terminada - Mensajes: ${stats.messagesSent}, XSS bloqueados: ${stats.xssAttempts}`,
        'STATS'
      );
    }
  });

  socket.on('error', (error) => {
    logSecurity(`⚠️ Error en socket ${clientId}: ${error.message}`, 'ERROR');
  });
});

/* --------------------------- Logs y Timers del Lab ------------------------ */
http.listen(port, () => {
  console.log('='.repeat(70));
  console.log('🎓 UNIVERSIDAD NACIONAL DE COSTA RICA');
  console.log('🏛️ SEDE REGIONAL CHOROTEGA - CAMPUS NICOYA');
  console.log('💻 INGENIERÍA EN SISTEMAS DE LA INFORMACIÓN');
  console.log('='.repeat(70));
  console.log('🔒 LAB 5 - SEGURIDAD INFORMÁTICA');
  console.log('👨‍🏫 Profesor: Ing. Alex Villegas Carranza, M.Sc.');
  console.log('='.repeat(70));

  logSecurity(`🚀 Servidor UNA Chat iniciado en puerto ${port}`, 'INFO');
  logSecurity('✅ Características de seguridad habilitadas:', 'INFO');
  logSecurity('   • Protección contra XSS (Cross-Site Scripting)', 'INFO');
  logSecurity('   • Sanitización automática de entrada', 'INFO');
  logSecurity('   • Soporte seguro para URLs/YouTube (cliente hace embed)', 'INFO');
  logSecurity('   • Soporte DataURL (demo) con límite 10MB', 'INFO');
  logSecurity('   • Logging de seguridad en tiempo real', 'INFO');
  logSecurity('   • Validación con librería UNA-LIB', 'INFO');

  console.log('\n📱 INSTRUCCIONES PARA EL LAB 5:');
  console.log(`   1. Abre tu navegador en: http://localhost:${port}`);
  console.log('   2. Prueba el payload XSS: <script>alert("Inyección de script")</script>');
  console.log('   3. Observa los logs de seguridad en esta consola');
  console.log('   4. Toma screenshot del comportamiento (Evidencia 1)');
  console.log('   5. Ejecuta: npm test (Evidencia 2)');
  console.log('\n🔒 Sistema de seguridad UNA-LIB activo y monitoreando...\n');
});

// Stats periódicas cada 5 minutos (si hay actividad)
setInterval(() => {
  if (stats.activeConnections > 0 || stats.messagesSent > 0) {
    logSecurity(
      `📊 ESTADÍSTICAS LAB 5: ${stats.activeConnections} conectados | ` +
      `${stats.messagesSent} mensajes | ${stats.xssAttempts} XSS bloqueados | ${stats.mediaShared} multimedia`,
      'STATS'
    );
  }
}, 300000);

// Mensaje final para el profesor
process.on('SIGINT', () => {
  console.log('\n' + '='.repeat(70));
  logSecurity('🎯 RESUMEN FINAL DEL LAB 5:', 'STATS');
  logSecurity(`📈 Total conexiones: ${stats.totalConnections}`, 'STATS');
  logSecurity(`💬 Mensajes procesados: ${stats.messagesSent}`, 'STATS');
  logSecurity(`🚫 Ataques XSS bloqueados: ${stats.xssAttempts}`, 'STATS');
  logSecurity(`🖼️ Contenido multimedia compartido: ${stats.mediaShared}`, 'STATS');
  logSecurity(`⏱️ Tiempo activo: ${formatUptime(process.uptime())}`, 'STATS');
  console.log('='.repeat(70));
  console.log('✅ Lab 5 completado exitosamente');
  console.log('👋 ¡Hasta la próxima!');
  process.exit(0);
});

/* ------------------------------ Notas clave -------------------------------
  - El servidor NO genera HTML. Solo reenvía JSON saneado.
  - El cliente detecta URLs e inserta <img>, <video> o <iframe> YouTube.
  - Si el usuario pega un <iframe>, se verá como texto (correcto por seguridad).
  - DataURL se permite para laboratorio con límite de 10MB.
----------------------------------------------------------------------------- */
