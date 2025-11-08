# 🚀 Deploy en Render.com - Chat UNA Lab 5

## Paso 1: Preparar el repositorio

1. Asegúrate de que tu código esté en un repositorio de GitHub
2. Haz commit de todos los cambios:
   ```bash
   git add .
   git commit -m "Preparar para deploy en Render"
   git push origin main
   ```

## Paso 2: Crear cuenta en Render

1. Ve a [https://render.com](https://render.com)
2. Regístrate con tu cuenta de GitHub
3. Autoriza a Render para acceder a tus repositorios

## Paso 3: Crear nuevo Web Service

1. Click en **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub
3. Selecciona el repositorio del proyecto ChatMessage

## Paso 4: Configurar el servicio

**Build & Deploy:**
- **Name**: `una-chat-lab5` (o el nombre que prefieras)
- **Region**: Elige la más cercana (US East por defecto)
- **Branch**: `main`
- **Root Directory**: (dejar vacío si el proyecto está en la raíz)
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

## Paso 5: Variables de Entorno

En la sección **Environment Variables**, agrega las siguientes:

**IMPORTANTE**: Render te dará una URL como `https://una-chat-lab5.onrender.com`

```env
BASE_URL=https://una-chat-lab5.onrender.com
OKTA_ISSUER_URI=https://dev-tvx3q4w7tjkf5nnl.us.auth0.com/
OKTA_CLIENT_ID=y1QLFwtbulOfgcx4Cc6ZQM1f3x4lkBWv
OKTA_CLIENT_SECRET=qm0CLWqxLo8peWKJPI8gt03Vk-rUqb0yRF5N7sLhJ98SVJEG1QB_QnqRb2alInfu
REDIRECT_URI=https://una-chat-lab5.onrender.com/callback
PORT=3000
SECRET=hjsadfghjakshdfg87sd8f76s8d7f68s7f632342ug44gg423636346f
NODE_ENV=production
```

**⚠️ IMPORTANTE**: Reemplaza `una-chat-lab5.onrender.com` con tu URL real de Render

## Paso 6: Configurar Auth0

1. Ve a [Auth0 Dashboard](https://manage.auth0.com)
2. Ve a **Applications** → Tu aplicación
3. En **Settings**, agrega las siguientes URLs:

**Allowed Callback URLs:**
```
https://una-chat-lab5.onrender.com/callback
```

**Allowed Logout URLs:**
```
https://una-chat-lab5.onrender.com
```

**Allowed Web Origins:**
```
https://una-chat-lab5.onrender.com
```

**Allowed Origins (CORS):**
```
https://una-chat-lab5.onrender.com
```

4. Click en **Save Changes**

## Paso 7: Deploy

1. Click en **"Create Web Service"**
2. Render comenzará a hacer el build y deploy automáticamente
3. Espera unos 3-5 minutos

## Paso 8: Verificar

1. Una vez que el deploy termine, ve a tu URL de Render
2. Deberías ver la página de login
3. Prueba iniciar sesión con Auth0

## 🔧 Troubleshooting

### Error: "Application error"
- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs en Render Dashboard

### Error de Auth0
- Asegúrate de que las URLs en Auth0 coincidan exactamente con tu URL de Render
- Verifica que REDIRECT_URI y BASE_URL sean correctos

### Socket.IO no funciona
- Render soporta WebSockets nativamente, no debería haber problemas
- Si persiste, verifica los logs del servidor

## 📝 Notas

- **Free Tier**: Render tiene un plan gratuito pero el servicio puede "dormirse" después de 15 minutos de inactividad
- **Primera carga lenta**: La primera vez que accedes después de que se "duerma", puede tardar 30-60 segundos
- **Upgrade**: Considera el plan de pago ($7/mes) para evitar el "sleep"

## 🎉 ¡Listo!

Tu aplicación debería estar funcionando en:
```
https://tu-app.onrender.com
```
