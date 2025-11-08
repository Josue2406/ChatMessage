// Servidor de Chat UNA - Lab 5 Seguridad Informática
// Universidad Nacional - Sede Regional Chorotega Campus Nicoya

require("dotenv").config();

const { formatUptime, approxBytesFromDataURL, logSecurity } = require('./libs/server-utils');
const keyVault = require("./libs/keyVault");
const validation = require("./libs/unalib");
const express = require("express");
const session = require("express-session");
const { auth, requiresAuth } = require("express-openid-connect");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
const path = require("path");
const port = keyVault.getSecret("PORT") || 3000;

/* ----------------------------- Auth0 Config ------------------------------ */
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

app.use(auth(config));

/* --------------------------------- Session -------------------------------- */
app.use(
  session({
    cookie: { httpOnly: true },
    secret: keyVault.getSecret("SECRET"),
    resave: false,
    saveUninitialized: true,
  })
);

/* --------------------------------- Utils --------------------------------- */
// function logSecurity(message, level = "INFO") {
//   const timestamp = new Date().toISOString();
//   console.log(`[${timestamp}] [${level}] ${message}`);
// }

// function formatUptime(seconds) {
//   const hours = Math.floor(seconds / 3600);
//   const minutes = Math.floor((seconds % 3600) / 60);
//   const secs = Math.floor(seconds % 60);
//   return `${hours}h ${minutes}m ${secs}s`;
// }

// function approxBytesFromDataURL(dataUrl = "") {
//   const i = dataUrl.indexOf("base64,");
//   if (i === -1) return 0;
//   const b64 = dataUrl.slice(i + 7);
//   return Math.floor(b64.length * 0.75);
// }

/* ------------------------------ Static & HTTP ----------------------------- */
// Servir archivos estáticos desde dist/ (excepto index.html)
app.use(express.static(path.join(__dirname, "dist"), { index: false }));

// Ruta principal: muestra página de login o redirige al chat
app.get("/", (req, res) => {
  if (req.oidc.isAuthenticated()) {
    res.redirect("/chat");
  } else {
    res.sendFile(path.join(__dirname, "login.html"));
  }
});

// Ruta del chat: requiere autenticación
app.get("/chat", requiresAuth(), (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// API para obtener datos del usuario autenticado
app.get("/api/user", requiresAuth(), (req, res) => {
  res.json({
    email: req.oidc.user.email,
    name: req.oidc.user.name,
    nickname: req.oidc.user.nickname,
    picture: req.oidc.user.picture,
  });
});

app.get("/info", (req, res) => {
  res.json({
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
    timestamp: new Date().toISOString(),
  });
});

/* --------------------------------- Stats --------------------------------- */
const stats = {
  totalConnections: 0,
  activeConnections: 0,
  messagesSent: 0,
  blockedMessages: 0,
  xssAttempts: 0,
  mediaShared: 0,
};

app.get("/stats", (req, res) => {
  res.json({
    ...stats,
    uptime: process.uptime(),
    uptimeFormatted: formatUptime(process.uptime()),
    securityStatus: "ACTIVE",
    lab: "Lab 5 - Seguridad Informática",
    timestamp: new Date().toISOString(),
  });
});

/* -------------------------- KeyVault Endpoints --------------------------- */
// Endpoints para verificar KeyVault
app.get("/api/keyvault/status", (req, res) => {
  try {
    res.json({
      success: true,
      message: "KeyVault is working",
      environment: keyVault.getSecret("NODE_ENV"),
      secretsLoaded: keyVault.getAllSecretNames().length,
      secrets: keyVault.getAllSecretNames().map((name) => ({
        name,
        loaded: true,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    keyVaultStatus: "active",
    secretsCount: keyVault.getAllSecretNames().length,
    timestamp: new Date().toISOString(),
  });
});

/* ---------------------- KeyVault Auditoría y Seguridad ------------------- */
// Endpoint de logs de auditoría
app.get("/api/keyvault/audit", (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = keyVault.getAuditLogs(limit);

    res.json({
      success: true,
      totalLogs: logs.length,
      logs: logs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Endpoint de logs de accesos fallidos
app.get("/api/keyvault/audit/failures", (req, res) => {
  try {
    const logs = keyVault.getFailedAccessLogs();

    res.json({
      success: true,
      failedAttempts: logs.length,
      logs: logs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Endpoint de métricas de seguridad
app.get("/api/keyvault/metrics", (req, res) => {
  try {
    const metrics = keyVault.getSecurityMetrics();

    res.json({
      success: true,
      metrics: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Endpoint de estado de seguridad
app.get("/api/keyvault/security", (req, res) => {
  try {
    const status = keyVault.getSecurityStatus();

    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/* ------------------------------- WebSockets ------------------------------- */
io.on("connection", (socket) => {
  stats.totalConnections++;
  stats.activeConnections++;

  const clientId = socket.id;
  const clientIP = socket.handshake.address;
  logSecurity(`Nueva conexión: ${clientId} desde ${clientIP}`, "INFO");

  socket.emit("connection-info", {
    id: clientId,
    connectedAt: new Date().toISOString(),
    serverInfo: "UNA Chat Lab 5 - Servidor Seguro Activo",
    securityLevel: "HIGH",
  });

  socket.on("Evento-Mensaje-Server", (msg) => {
    try {
      logSecurity(`Mensaje recibido de ${clientId}`, "INFO");
      const original = JSON.parse(msg || "{}");

      const sanitize = (t) =>
        validation?.sanitizeText
          ? validation.sanitizeText(String(t ?? ""))
          : String(t ?? "");

      const nombre = sanitize(original.nombre || "Anónimo").slice(0, 50);
      const mensaje = sanitize(original.mensaje || "").slice(0, 2000);
      const ts = Number(original.ts) || Date.now();

      const payload = { nombre, mensaje, ts };

      if (
        validation?.isScriptInjection &&
        validation.isScriptInjection(original.mensaje)
      ) {
        stats.blockedMessages++;
        stats.xssAttempts++;
        logSecurity(
          `🚨 INTENTO DE XSS DETECTADO Y BLOQUEADO 🚨 Cliente: ${clientId}`,
          "WARNING"
        );
        socket.emit("security-warning", {
          message:
            "⚠️ Intento de script injection detectado y bloqueado por seguridad",
          timestamp: new Date().toISOString(),
          action: "Message sanitized and logged",
          labInfo: "Lab 5 - Demostración de protección XSS",
        });
      }

      if (original.media && typeof original.media === "object") {
        const { type, dataUrl, mime, name, size, url } = original.media;

        if (
          typeof dataUrl === "string" &&
          (type === "image" || type === "video")
        ) {
          const isImage = /^data:image\//i.test(dataUrl);
          const isVideo = /^data:video\//i.test(dataUrl);
          const bytes = approxBytesFromDataURL(dataUrl);
          const MAX_BYTES = 10 * 1024 * 1024;

          if ((isImage || isVideo) && bytes > 0 && bytes <= MAX_BYTES) {
            payload.media = {
              type,
              dataUrl,
              mime: String(mime || "").slice(0, 100),
              name: String(name || "").slice(0, 120),
              size: Number(size) || bytes,
            };
            stats.mediaShared++;
          } else {
            logSecurity(
              `Media DataURL rechazada (tipo/tamaño inválido)`,
              "WARNING"
            );
          }
        }

        if (!payload.media && (url || original.media.link)) {
          const link = String(url || original.media.link);
          if (
            !validation?.isValidMediaURL ||
            validation.isValidMediaURL(link)
          ) {
            payload.media = { type: type || "url", url: link };
            stats.mediaShared++;
          } else {
            logSecurity(`URL de media no válida: ${link}`, "WARNING");
          }
        }
      }

      let finalOut = payload;
      if (validation?.validateMessage) {
        try {
          const validated = validation.validateMessage(JSON.stringify(payload));
          finalOut = JSON.parse(validated);
        } catch {
          finalOut = payload;
        }
      }

      io.emit("Evento-Mensaje-Server", JSON.stringify(finalOut));
      stats.messagesSent++;
      logSecurity(
        `Mensaje validado y enviado a ${stats.activeConnections} clientes`,
        "INFO"
      );
    } catch (error) {
      logSecurity(
        `❌ Error procesando mensaje de ${clientId}: ${error.message}`,
        "ERROR"
      );
      const errorMsg = {
        nombre: "Sistema UNA",
        mensaje:
          "⚠️ Error procesando mensaje. Mensaje bloqueado por seguridad.",
        ts: Date.now(),
      };
      socket.emit("Evento-Mensaje-Server", JSON.stringify(errorMsg));
    }
  });

  socket.on("disconnect", (reason) => {
    stats.activeConnections--;
    logSecurity(`Cliente desconectado: ${clientId}, razón: ${reason}`, "INFO");
  });
});

/* --------------------------- Logs y Timers del Lab ------------------------ */
http.listen(port, () => {
  console.log("=".repeat(70));
  console.log("🎓 UNIVERSIDAD NACIONAL DE COSTA RICA");
  console.log("🏛️ SEDE REGIONAL CHOROTEGA - CAMPUS NICOYA");
  console.log("💻 INGENIERÍA EN SISTEMAS DE LA INFORMACIÓN");
  console.log("=".repeat(70));
  console.log("🔒 LAB 5 - SEGURIDAD INFORMÁTICA");
  console.log("👨‍🏫 Profesor: Ing. Alex Villegas Carranza, M.Sc.");
  console.log("🔐 Auth0 Authentication Enabled");
  console.log("=".repeat(70));
  logSecurity(`🚀 Servidor UNA Chat iniciado en puerto ${port}`, "INFO");
});

setInterval(() => {
  if (stats.activeConnections > 0 || stats.messagesSent > 0) {
    logSecurity(
      `📊 ESTADÍSTICAS: ${stats.activeConnections} conectados | ${stats.messagesSent} mensajes | ${stats.xssAttempts} XSS bloqueados | ${stats.mediaShared} multimedia`,
      "STATS"
    );
  }
}, 300000);

/* ------------------------------ Notas clave -------------------------------
  - Auth0 maneja la autenticación de usuarios
  - El servidor requiere login antes de acceder al chat
  - El nombre de usuario se obtiene de Auth0
  - El servidor NO genera HTML. Solo reenvía JSON saneado.
  - El cliente detecta URLs e inserta <img>, <video> o <iframe> YouTube.
  - Si el usuario pega un <iframe>, se verá como texto (correcto por seguridad).
  - DataURL se permite para laboratorio con límite de 10MB.
----------------------------------------------------------------------------- */
