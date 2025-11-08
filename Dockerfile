# Stage 1: Testing y Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies para tests)
RUN npm ci

# Copiar código fuente
COPY . .

# Ejecutar linting, tests y build
RUN npm run lint && \
    npm test -- --coverage && \
    npm run build

# Stage 2: Producción (imagen ligera)
FROM node:22-alpine AS production

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Copiar código desde builder
COPY --from=builder /app/server.js ./
COPY --from=builder /app/libs ./libs/
COPY --from=builder /app/*.html ./
COPY --from=builder /app/dist ./dist/

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
CMD ["node", "server.js"]
