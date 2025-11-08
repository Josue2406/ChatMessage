# Pipeline CI/CD - Guía Rápida

## Configuración Inicial (5 minutos)

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Secrets en GitHub (Opcional)
```
Settings > Secrets and variables > Actions > New repository secret
```

Agregar:
- `SNYK_TOKEN` - Token de Snyk (obtener en https://app.snyk.io/account)
- `SEMGREP_APP_TOKEN` - Token de Semgrep (obtener en https://semgrep.dev/manage/settings/tokens)

**Nota**: El pipeline funciona sin estos tokens, pero con funcionalidad limitada.

---

## Comandos Esenciales

### Desarrollo Diario
```bash
# Ejecutar linting
npm run lint

# Corregir errores automáticamente
npm run lint:fix

# Ejecutar tests
npm test

# Ver cobertura
npm run test:coverage
```

### Antes de Hacer Commit
```bash
# Ejecutar pipeline completo localmente
npm run ci
```

Este comando ejecuta:
1. Linting con ESLint
2. Tests con Jest + Cobertura
3. Auditoría de seguridad de dependencias

---

## Estructura del Pipeline

```
┌─────────────┐
│   Push/PR   │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ✅ OBLIGATORIO
│   Linting   │     Debe pasar para continuar
└──────┬──────┘
       │
       ▼
┌─────────────┐     ✅ OBLIGATORIO
│ Unit Tests  │     Debe pasar + Cobertura >70%
└──────┬──────┘
       │
       ├─────────────────┬─────────────────┬─────────────────┐
       ▼                 ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   CodeQL    │   │   Semgrep   │   │    Snyk     │   │  Dep Audit  │
│    (SAST)   │   │    (SAST)   │   │    (SAST)   │   │             │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
  ℹ️ Informativo   ℹ️ Informativo   ℹ️ Informativo   ℹ️ Informativo
       │                 │                 │                 │
       └─────────────────┴─────────────────┴─────────────────┘
                                  │
                                  ▼
                          ┌─────────────┐
                          │Quality Gate │ ✅ Verifica checks obligatorios
                          └─────────────┘
```

---

## Herramientas SAST Implementadas

### 1. ESLint (Linting)
**Qué hace**: Analiza sintaxis y estilo de código
**Reglas de seguridad**:
- Previene uso de `eval()`
- Detecta inyección de objetos
- Valida RegEx seguros
- Detecta child processes inseguros

### 2. CodeQL (SAST Semántico)
**Qué hace**: Análisis profundo del flujo de datos
**Detecta**:
- SQL Injection
- XSS
- Path Traversal
- Command Injection
- Prototype Pollution

### 3. Semgrep (SAST Pattern-based)
**Qué hace**: Busca patrones de código inseguro
**Rulesets**:
- OWASP Top 10
- Node.js security
- JavaScript best practices

### 4. Snyk (Hybrid SAST)
**Qué hace**: Analiza código y dependencias
**Detecta**:
- Vulnerabilidades en dependencias npm
- Code smells de seguridad
- Configuraciones inseguras

---

## Criterios de Calidad (Quality Gates)

### Para que el Pipeline Pase:

#### ✅ Obligatorios
- **Linting**: Cero errores de ESLint
- **Unit Tests**: Todos los tests pasan
- **Cobertura**: Mínimo 70% en:
  - Branches (ramificaciones)
  - Functions (funciones)
  - Lines (líneas)
  - Statements (sentencias)

#### ℹ️ Informativos (no bloquean)
- CodeQL findings
- Semgrep findings
- Snyk vulnerabilities
- npm audit warnings

---

## Resolución Rápida de Problemas

### ❌ Linting Falla
```bash
# Ver errores
npm run lint

# Intentar corregir automáticamente
npm run lint:fix

# Si hay errores que no se pueden corregir automáticamente,
# editar manualmente los archivos indicados
```

### ❌ Tests Fallan
```bash
# Ejecutar tests con output detallado
npm test -- --verbose

# Ejecutar solo un archivo de test
npm test test/unalib.test.js

# Modo watch para desarrollo
npm run test:watch
```

### ❌ Cobertura Insuficiente
```bash
# Ver reporte detallado
npm run test:coverage

# Abrir reporte HTML
# Windows:
start coverage/index.html

# macOS:
open coverage/index.html

# Linux:
xdg-open coverage/index.html

# Agregar tests para archivos con baja cobertura
```

### ⚠️ Vulnerabilidades en Dependencias
```bash
# Ver vulnerabilidades
npm audit

# Corregir automáticamente
npm audit fix

# Actualizar dependencias manualmente
npm update

# Para vulnerabilidades sin fix automático,
# revisar npm audit y actualizar package.json manualmente
```

---

## Ver Resultados del Pipeline

### En Pull Request
1. Crear PR en GitHub
2. Esperar a que se ejecuten los checks
3. Ver resultados en la pestaña "Checks"
4. Si hay errores, click en el job fallido para ver detalles

### Descargar Reportes
1. Ir a: `Actions > [Tu workflow run]`
2. Scroll hasta "Artifacts"
3. Descargar:
   - `coverage-report` - Cobertura de tests (HTML navegable)
   - `linting-reports` - Errores de ESLint (HTML/JSON)
   - `dependency-audit` - Vulnerabilidades de dependencias

### Ver Alertas de Seguridad
1. Ir a: `Security > Code scanning alerts`
2. Ver vulnerabilidades detectadas por CodeQL
3. Click en cada alerta para detalles y recomendaciones

---

## Flujo de Trabajo Recomendado

### Para cada Feature/Fix:

1. **Crear rama**
   ```bash
   git checkout -b feature/mi-nueva-funcionalidad
   ```

2. **Desarrollar con tests**
   ```bash
   # Escribir código
   # Escribir tests (BDD style)
   npm test -- --watch
   ```

3. **Verificar calidad localmente**
   ```bash
   npm run ci
   ```

4. **Commit y push**
   ```bash
   git add .
   git commit -m "feat: agregar nueva funcionalidad"
   git push origin feature/mi-nueva-funcionalidad
   ```

5. **Crear Pull Request**
   - GitHub ejecutará el pipeline automáticamente
   - Esperar a que todos los checks pasen
   - Revisar reportes si hay errores

6. **Corregir si es necesario**
   ```bash
   # Hacer cambios
   npm run ci  # Verificar localmente
   git add .
   git commit -m "fix: corregir errores de linting"
   git push
   ```

7. **Merge cuando todo pase**
   - Quality Gate en verde ✅
   - Todos los checks obligatorios pasan
   - Code review aprobado

---

## Escritura de Tests (BDD Style)

### Estructura Recomendada
```javascript
describe('Feature: User Authentication', () => {
  describe('Scenario: Valid login', () => {
    test('should return user token when credentials are correct', () => {
      // Given - Preparación
      const username = 'testuser';
      const password = 'securePassword123';

      // When - Acción
      const result = authenticate(username, password);

      // Then - Verificación
      expect(result).toHaveProperty('token');
      expect(result.token).toBeTruthy();
    });
  });

  describe('Scenario: Invalid login', () => {
    test('should throw error when credentials are incorrect', () => {
      // Given
      const username = 'testuser';
      const password = 'wrongPassword';

      // When & Then
      expect(() => {
        authenticate(username, password);
      }).toThrow('Invalid credentials');
    });
  });
});
```

### Cobertura de Tests
Asegurar que cada función tenga:
- ✅ Test de caso exitoso (happy path)
- ✅ Test de casos de error
- ✅ Test de edge cases (valores límite, null, undefined)
- ✅ Test de validaciones de seguridad

---

## Configuración Avanzada (Opcional)

### Ajustar Umbrales de Cobertura
Editar `jest.config.js`:
```javascript
coverageThreshold: {
  global: {
    branches: 80,     // Cambiar de 70 a 80
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

### Agregar Reglas de ESLint
Editar `.eslintrc.json`:
```json
{
  "rules": {
    "nueva-regla": "error"
  }
}
```

### Deshabilitar Checks Opcionales
Editar `.github/workflows/ci-pipeline.yml`:
```yaml
# Comentar el job que no deseas ejecutar
# sast-semgrep:
#   name: SAST - Semgrep Analysis
#   ...
```

---

## Recursos Adicionales

📖 **Documentación Completa**: Ver `CI_CD_DOCUMENTATION.md`

🔗 **Enlaces Útiles**:
- [ESLint Rules](https://eslint.org/docs/latest/rules/)
- [Jest Matchers](https://jestjs.io/docs/expect)
- [BDD with Jest](https://jestjs.io/docs/using-matchers)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

🛠️ **Tools**:
- Snyk: https://app.snyk.io
- Semgrep: https://semgrep.dev
- CodeQL Docs: https://codeql.github.com

---

## Contacto y Soporte

**Proyecto**: UNA Chat - Lab 5 Seguridad Informática
**Universidad**: Universidad Nacional de Costa Rica
**Campus**: Sede Regional Chorotega - Campus Nicoya
**Profesor**: Ing. Alex Villegas Carranza, M.Sc.

Para dudas o problemas, consultar primero esta guía y la documentación completa en `CI_CD_DOCUMENTATION.md`.
