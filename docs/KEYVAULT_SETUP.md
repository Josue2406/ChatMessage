# KeyVault Setup - Instrucciones para Render

## 🔐 Variables de entorno requeridas en Render

El compañero que despliega debe configurar estas variables en Render.

### 📋 Configuración en Render Dashboard:

1. **Ir a tu servicio en Render**

   - Ve a: https://dashboard.render.com
   - Selecciona el servicio: **chatmessage-q0jz**

2. **Acceder a Variables de Entorno**

   - Environment → Environment Variables
   - Click en "Add Environment Variable"

3. **Agregar cada una de estas variables:**

```env
BASE_URL=https://chatmessage-q0jz.onrender.com
OKTA_ISSUER_URI=https://dev-tvx3q4w7tjkf5nnl.us.auth0.com/
OKTA_CLIENT_ID=y1QLFwtbulOfgcx4Cc6ZQM1f3x4lkBWv
OKTA_CLIENT_SECRET=qm0CLWqxLo8peWKJPI8gt03Vk-rUqb0yRF5N7sLhJ98SVJEG1QB_QnqRb2alInfu
REDIRECT_URI=https://chatmessage-q0jz.onrender.com/callback
PORT=3000
SECRET=hjsadfghjakshdfg87sd8f76s8d7f68s7f632342ug44gg423636346f
NODE_ENV=production
```

4. **Para cada variable:**

   - Key: (nombre de la variable)
   - Value: (valor correspondiente)
   - Click "Add"

5. **Guardar cambios**
   - Click "Save Changes" al final
   - Render redesplegará automáticamente el servicio

---

## ✅ Verificar que funciona

Después del deployment, visitar estas URLs para verificar:

### 1. Estado del KeyVault

```
https://chatmessage-q0jz.onrender.com/api/keyvault/status
```

### 2. Health Check

```
https://chatmessage-q0jz.onrender.com/api/health
```

### 3. **Logs de Auditoría** (NUEVO ✨)

```
https://chatmessage-q0jz.onrender.com/api/keyvault/audit
```

Muestra los últimos accesos a secretos con timestamp, resultado y mensaje.

**Ejemplo de respuesta:**

```json
{
  "success": true,
  "totalLogs": 15,
  "logs": [
    {
      "timestamp": "2025-11-07T18:45:23.123Z",
      "action": "ACCESS",
      "secretName": "OKTA_CLIENT_ID",
      "success": true,
      "message": "Secret accessed successfully",
      "severity": "INFO"
    }
  ]
}
```

### 4. **Intentos Fallidos** (NUEVO 🚨)

```
https://chatmessage-q0jz.onrender.com/api/keyvault/audit/failures
```

Muestra solo los intentos de acceso fallidos (detecta actividad sospechosa).

### 5. **Métricas de Seguridad** (NUEVO 📊)

```
https://chatmessage-q0jz.onrender.com/api/keyvault/metrics
```

**Ejemplo de respuesta:**

```json
{
  "success": true,
  "metrics": {
    "totalAccesses": 150,
    "successfulAccesses": 145,
    "failedAccesses": 5,
    "suspiciousAttempts": 5,
    "successRate": "96.67%",
    "failureRate": "3.33%",
    "accessesBySecret": {
      "OKTA_CLIENT_ID": 45,
      "SECRET": 40,
      "BASE_URL": 35
    }
  }
}
```

### 6. **Monitor de Seguridad** (NUEVO 🔒)

```
https://chatmessage-q0jz.onrender.com/api/keyvault/security
```

Estado de seguridad en tiempo real con alertas automáticas.

**Ejemplo de respuesta:**

```json
{
  "success": true,
  "status": "SECURE",
  "alerts": [],
  "metrics": { ... },
  "timestamp": "2025-11-07T..."
}
```

**Estados posibles:**

- 🟢 `SECURE` - Todo funcionando correctamente
- 🟡 `WARNING` - Actividad sospechosa detectada
- 🔴 `CRITICAL` - Alto número de intentos fallidos

### 7. Estadísticas del Chat

```
https://chatmessage-q0jz.onrender.com/stats
```

---

## 🔧 Notas importantes

### ✅ Ventajas del KeyVault

- ✅ El KeyVault carga automáticamente las variables de entorno
- ✅ No se requiere instalación de paquetes adicionales
- ✅ Funciona tanto en local (`.env`) como en Render
- ✅ Centraliza la gestión de secretos
- ✅ Manejo de errores si falta algún secreto
- ✨ **NUEVO: Logs de auditoría** - Rastrea cada acceso a secretos
- ✨ **NUEVO: Monitor de seguridad** - Detecta actividad sospechosa en tiempo real
- ✨ **NUEVO: Métricas avanzadas** - Estadísticas de uso y tasa de éxito

### 🔐 Características de Seguridad

1. **Auditoría completa** - Cada acceso a un secreto queda registrado
2. **Detección de anomalías** - Alerta automática si hay >= 5 intentos fallidos
3. **Métricas en tiempo real** - Monitoreo continuo de accesos
4. **Logs persistentes** - Mantiene los últimos 1000 eventos
5. **Estado de seguridad** - Clasificación automática: SECURE, WARNING, CRITICAL

### ⚠️ Consideraciones de seguridad

- 🔒 NUNCA subir el archivo `.env` al repositorio
- 🔒 El archivo `.env` debe estar en `.gitignore`
- 🔒 Cambiar el `SECRET` en producción por uno más seguro
- 🔒 Verificar que `OKTA_CLIENT_SECRET` sea válido
- 🚨 Monitorear `/api/keyvault/security` regularmente
- 📊 Revisar `/api/keyvault/audit/failures` para detectar ataques

### 🐛 Troubleshooting

**Error: "Secret 'X' not found in KeyVault"**

- Verificar que la variable esté configurada en Render
- Verificar el nombre exacto (case-sensitive)
- Guardar cambios y esperar el re-deploy automático

**Error 500 en `/api/keyvault/status`**

- Verificar que todas las variables estén configuradas
- Revisar los logs en Render: Logs → Ver logs del servicio

**El servicio no inicia**

- Verificar que todas las 8 variables estén configuradas
- Revisar los logs de deployment en Render
- Verificar que el `PORT` sea 3000 o el que Render asigne

---

## 📦 Deployment Steps

1. **Push el código al repositorio**

   ```bash
   git add .
   git commit -m "Add KeyVault implementation"
   git push origin main
   ```

2. **Configurar variables en Render Dashboard**

   - Ir a https://dashboard.render.com
   - Seleccionar el servicio: chatmessage-q0jz
   - Agregar las 8 variables de entorno

3. **Deploy automático**

   - Render detecta el push y hace deploy automático
   - O hacer deploy manual: "Manual Deploy" → "Deploy latest commit"

4. **Verificar funcionamiento**
   - Probar las URLs de verificación listadas arriba

---

## 🎓 Universidad Nacional de Costa Rica

**Lab 5 - Seguridad Informática**  
Implementación de gestión segura de secretos tipo Azure Key Vault para Render

---

## 📞 Soporte

Si hay problemas durante el deployment, verificar:

1. Logs en Render Dashboard → Logs
2. Variables de entorno configuradas correctamente (8 variables)
3. `libs/keyVault.js` presente en el repositorio
4. `server.js` actualizado con el KeyVault

---

## 💬 Mensaje para tu compañero:

```
Hey! Acabo de subir la implementación de KeyVault al repo 🚀

Para que funcione en Render:
1. Ve a https://dashboard.render.com
2. Abre nuestro servicio (chatmessage-q0jz)
3. Environment → Environment Variables
4. Agrega las 8 variables que están en KEYVAULT_SETUP.md
5. Guarda (se redespliega automáticamente)

Una vez desplegado, verifica:
✅ https://chatmessage-q0jz.onrender.com/api/keyvault/status
✅ https://chatmessage-q0jz.onrender.com/api/health

Todo el código ya está listo, solo falta agregar las variables! 🎯
```
