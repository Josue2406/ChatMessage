# Docker - Guía de Uso

## 🐳 Comandos Docker Compose

### Aplicación Principal

```bash
# Ejecutar aplicación en producción
docker-compose up app

# En background (detached mode)
docker-compose up -d app

# Ver logs
docker-compose logs -f app

# Detener
docker-compose down
```

### ⭐ App + Tests Simultáneos (NUEVO)

```bash
# Levantar app Y ejecutar tests al mismo tiempo (con logs visibles)
docker-compose up app-with-tests

# Esto mostrará en consola:
# 1. Inicio de la aplicación
# 2. Ejecución de tests con resultados
# 3. Reporte de cobertura
```

### Tests y CI/CD

```bash
# Ejecutar SOLO tests
docker-compose run --rm test

# Ejecutar SOLO linting
docker-compose run --rm lint

# Ejecutar SOLO auditoría de seguridad
docker-compose run --rm security

# Ejecutar pipeline COMPLETO (lint + test + security)
docker-compose run --rm ci

# App en background + Tests en foreground
docker-compose up -d app && docker-compose run --rm test
```

### Modo Desarrollo

```bash
# Ejecutar en modo desarrollo con hot-reload
docker-compose up dev

# Con logs visibles
docker-compose up dev --build
```

---

## 📦 Comandos Docker (sin Compose)

### Build

```bash
# Build para producción
docker build -t chatmessage:latest .

# Build solo stage de tests (más rápido para desarrollo)
docker build --target builder -t chatmessage:test .
```

### Run

```bash
# Ejecutar aplicación
docker run -p 3000:3000 chatmessage:latest

# Ejecutar tests
docker run --rm chatmessage:test npm test

# Ejecutar tests con coverage y extraer reporte
docker run --rm -v ${PWD}/coverage:/app/coverage chatmessage:test npm test -- --coverage

# Ejecutar linting
docker run --rm chatmessage:test npm run lint
```

---

## 🔍 Verificar que Tests se Ejecutan en Build

```bash
# Build con logs visibles
docker build --no-cache --progress=plain .
```

Si los tests fallan, el build se detendrá y verás el error.

---

## 📊 Ver Reporte de Cobertura

Después de ejecutar tests:

```bash
# Generar reporte
docker-compose run --rm test

# Abrir reporte HTML en navegador
# Windows
start coverage/index.html

# Linux/Mac
open coverage/index.html
```

---

## 🛠️ Troubleshooting

### Limpiar cache de Docker

```bash
# Eliminar imágenes antiguas
docker-compose down --rmi all

# Rebuild desde cero
docker-compose build --no-cache

# Limpiar todo (imágenes, volúmenes, redes)
docker system prune -a --volumes
```

### Ver logs de build

```bash
docker-compose build --progress=plain
```

---

## 📋 Estructura Multi-Stage

El `Dockerfile` tiene 2 stages:

1. **builder**: Ejecuta lint + tests + build (contiene devDependencies)
2. **production**: Imagen final optimizada (solo runtime dependencies)

Esto asegura que:
- ✅ Los tests SIEMPRE se ejecutan antes de crear la imagen de producción
- ✅ La imagen final es ligera (sin devDependencies)
- ✅ Si los tests fallan, el build se detiene

---

## 🚀 Workflow Recomendado

```bash
# 1. Desarrollo local
docker-compose up dev

# 2. Antes de commit - verificar CI
docker-compose run --rm ci

# 3. Build de producción (incluye tests automáticamente)
docker-compose build app

# 4. Deploy
docker-compose up -d app
```
