# Documentación del Pipeline CI/CD

## Índice
- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Arquitectura del Pipeline](#arquitectura-del-pipeline)
- [Herramientas Implementadas](#herramientas-implementadas)
- [Configuración y Uso](#configuración-y-uso)
- [Quality Gates](#quality-gates)
- [Reportes y Artefactos](#reportes-y-artefactos)
- [Solución de Problemas](#solución-de-problemas)

---

## Resumen Ejecutivo

Este proyecto implementa un pipeline completo de CI/CD con enfoque en seguridad y calidad de código, cumpliendo con los siguientes requisitos:

### Componentes Principales

1. **SAST (Static Application Security Testing)** - Análisis de seguridad estático
2. **Linting** - Análisis de calidad y estilo de código
3. **Unit Tests** - Pruebas unitarias basadas en BDD (Behavior-Driven Development)

### Pipeline Flow

```
┌─────────────┐
│   Push/PR   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Linting   │ ◄─── ESLint + Security Rules
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Unit Tests  │ ◄─── Jest + Coverage (BDD)
└──────┬──────┘
       │
       ├─────────────────┬─────────────────┬─────────────────┐
       ▼                 ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   CodeQL    │   │   Semgrep   │   │    Snyk     │   │  Dep Check  │
│    SAST     │   │    SAST     │   │    SAST     │   │             │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │                 │
       └─────────────────┴─────────────────┴─────────────────┘
                                  │
                                  ▼
                          ┌─────────────┐
                          │Quality Gate │
                          └─────────────┘
```

---

## Arquitectura del Pipeline

### Archivo Principal
- **Ubicación**: `.github/workflows/ci-pipeline.yml`
- **Triggers**: Push y Pull Requests a ramas `main` y `dev`
- **Ejecución Manual**: Disponible mediante `workflow_dispatch`

### Jobs Implementados

#### 1. Linting (Job Obligatorio)
**Descripción**: Análisis sintáctico y de estilo de código
- **Herramienta**: ESLint v9.38.0
- **Configuración**: `.eslintrc.json`
- **Plugins**:
  - `eslint-plugin-security` - Reglas de seguridad
- **Reglas Principales**:
  - Prevención de `eval()` y código dinámico peligroso
  - Detección de inyección de objetos
  - Detección de RegEx inseguros
  - Detección de buffers sin assert
  - Validación de procesos hijo
  - Detección de timing attacks

**Comandos Locales**:
```bash
npm run lint              # Ejecutar linting
npm run lint:fix          # Corregir automáticamente
npm run lint:report       # Generar reporte JSON/HTML
```

#### 2. Unit Tests (Job Obligatorio)
**Descripción**: Pruebas unitarias basadas en BDD con cobertura de código
- **Framework**: Jest v29.7.0
- **Configuración**: `jest.config.js`
- **Estilo**: BDD (Behavior-Driven Development)
- **Cobertura Mínima**: 70% (branches, functions, lines, statements)
- **Reportes**: Text, HTML, LCOV, JSON, Cobertura XML

**Estructura de Tests**:
```javascript
describe('Feature Name', () => {
  describe('Scenario', () => {
    test('should do something specific', () => {
      // Given (preparación)
      // When (acción)
      // Then (verificación con expect)
    });
  });
});
```

**Comandos Locales**:
```bash
npm test                  # Ejecutar tests
npm run test:watch        # Modo watch
npm run test:coverage     # Con reporte de cobertura
npm run test:ci           # Modo CI con reportes XML
```

**Archivos de Test**:
- `test/unalib.test.js` - Tests de validación y seguridad
- `test/test.js` - Tests de compatibilidad legacy

#### 3. SAST - CodeQL
**Descripción**: Análisis semántico de código de GitHub
- **Lenguaje**: JavaScript
- **Queries**: `security-extended`, `security-and-quality`
- **Integración**: GitHub Security tab
- **Vulnerabilidades Detectadas**:
  - SQL Injection
  - XSS (Cross-Site Scripting)
  - Path Traversal
  - Command Injection
  - Prototype Pollution
  - ReDoS (Regular Expression Denial of Service)

#### 4. SAST - Semgrep
**Descripción**: Análisis estático con reglas customizables
- **Rulesets Aplicados**:
  - `p/security-audit` - Auditoría de seguridad general
  - `p/nodejs` - Reglas específicas de Node.js
  - `p/owasp-top-ten` - Top 10 de OWASP
  - `p/javascript` - Mejores prácticas de JavaScript

**Configuración**:
- Variable de entorno requerida: `SEMGREP_APP_TOKEN`
- Continúa en caso de error (no bloquea el pipeline)

#### 5. SAST - Snyk
**Descripción**: Análisis de vulnerabilidades en código y dependencias
- **Análisis Dual**:
  - Análisis de código fuente
  - Análisis de dependencias (npm packages)
- **Threshold**: Severidad alta o superior
- **Integración**: GitHub Security (SARIF format)

**Configuración**:
- Variable de entorno requerida: `SNYK_TOKEN`
- Genera archivo SARIF para GitHub Security

#### 6. Dependency Check
**Descripción**: Auditoría de vulnerabilidades en dependencias
- **Herramienta**: npm audit
- **Nivel de Auditoría**: Moderate o superior
- **Formato de Reporte**: JSON

**Comandos Locales**:
```bash
npm run security:audit     # Auditoría de dependencias
npm run security:check     # Linting + Tests + Audit
```

#### 7. Quality Gate
**Descripción**: Validación final antes de aprobar el pipeline
- **Checks Obligatorios**:
  - ✅ Linting debe pasar
  - ✅ Unit Tests deben pasar con cobertura mínima
- **Checks Informativos**:
  - ℹ️ CodeQL (no bloquea)
  - ℹ️ Semgrep (no bloquea)
  - ℹ️ Snyk (no bloquea)
  - ℹ️ Dependency Check (no bloquea)

**Condiciones de Fallo**:
```yaml
if unit-tests.result != "success" then FAIL
if linting.result != "success" then FAIL
```

---

## Herramientas Implementadas

### Comparación de Herramientas SAST

| Herramienta | Tipo | Fortalezas | Debilidades | Uso Recomendado |
|-------------|------|------------|-------------|-----------------|
| **CodeQL** | Semántico | Análisis profundo, bajo falsos positivos | Lento, consume recursos | Vulnerabilidades críticas |
| **Semgrep** | Pattern-based | Rápido, customizable | Puede tener falsos positivos | Reglas custom, auditorías |
| **Snyk** | Híbrido | Excelente para dependencias | Requiere cuenta | Gestión de dependencias |
| **ESLint** | Sintáctico | Rápido, integrado | Solo análisis superficial | Pre-commit, desarrollo |

### Alternativas Evaluadas

#### Otras Opciones SAST:
1. **SonarQube** (no implementado)
   - Pros: Muy completo, métricas de calidad detalladas
   - Contras: Requiere servidor, configuración compleja

2. **Checkmarx** (no implementado)
   - Pros: Enterprise-grade, muy preciso
   - Contras: Comercial, costoso

3. **Bandit** (no aplicable)
   - Pros: Excelente para Python
   - Contras: Solo Python

---

## Configuración y Uso

### Configuración Inicial

#### 1. Secrets de GitHub
Configurar en: `Settings > Secrets and variables > Actions`

```yaml
# Opcional pero recomendado
SNYK_TOKEN: <tu-token-de-snyk>
SEMGREP_APP_TOKEN: <tu-token-de-semgrep>
```

**Obtener Tokens**:
- Snyk: https://app.snyk.io/account
- Semgrep: https://semgrep.dev/manage/settings/tokens

#### 2. Permisos del Workflow
Ya configurados en el archivo, pero verificar:
```yaml
permissions:
  actions: read
  contents: read
  security-events: write
```

### Ejecución Local

#### Pre-commit Checklist
```bash
# 1. Ejecutar linting
npm run lint

# 2. Corregir issues automáticamente
npm run lint:fix

# 3. Ejecutar tests con cobertura
npm run test:coverage

# 4. Auditoría de seguridad
npm run security:audit

# 5. Pipeline completo (simula CI)
npm run ci
```

#### Instalación de Dependencias
```bash
npm ci  # Para CI (usa package-lock.json exacto)
npm install  # Para desarrollo local
```

### Integración con PR

Cuando creas un Pull Request:
1. El pipeline se ejecuta automáticamente
2. Verás checks en la PR:
   - ✅ Linting
   - ✅ Unit Tests
   - ℹ️ CodeQL Analysis
   - ℹ️ Semgrep Analysis
   - ℹ️ Snyk Security
   - ℹ️ Dependency Check
   - ✅ Quality Gate

3. Solo se puede mergear si:
   - Linting pasa
   - Unit Tests pasan
   - Quality Gate pasa

---

## Quality Gates

### Criterios de Aceptación

#### Obligatorios (Bloquean Merge)
- ✅ **Linting**: 0 errores de ESLint
- ✅ **Unit Tests**: Todos los tests pasan
- ✅ **Cobertura**: Mínimo 70% en todas las métricas

#### Informativos (No Bloquean)
- ℹ️ **CodeQL**: Detecta vulnerabilidades críticas
- ℹ️ **Semgrep**: Detecta patrones inseguros
- ℹ️ **Snyk**: Identifica dependencias vulnerables
- ℹ️ **npm audit**: Lista vulnerabilidades conocidas

### Umbrales de Cobertura

Configurados en `jest.config.js`:
```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70
  }
}
```

Para cambiar los umbrales, editar `jest.config.js` y ajustar los valores.

---

## Reportes y Artefactos

### Artefactos Generados

El pipeline genera los siguientes artefactos descargables:

#### 1. Linting Reports
- **Nombre**: `linting-reports`
- **Archivos**:
  - `eslint-report.json` - Reporte en JSON
  - `eslint-report.html` - Reporte visual HTML
- **Retención**: 30 días
- **Ubicación**: Actions > Workflow Run > Artifacts

#### 2. Coverage Reports
- **Nombre**: `coverage-report`
- **Archivos**:
  - `coverage/index.html` - Reporte HTML navegable
  - `coverage/lcov.info` - LCOV para integración
  - `coverage/coverage-final.json` - JSON detallado
  - `coverage/cobertura-coverage.xml` - XML para SonarQube
- **Retención**: 30 días

#### 3. Dependency Audit
- **Nombre**: `dependency-audit`
- **Archivo**: `npm-audit-report.json`
- **Retención**: 30 días

#### 4. Security Findings
- **Ubicación**: GitHub Security Tab
- **Herramientas**:
  - CodeQL Analysis
  - Snyk (si SARIF upload funciona)

### Visualización de Reportes

#### Coverage Report HTML
1. Ir a Actions > Workflow Run
2. Descargar artifact `coverage-report`
3. Extraer y abrir `coverage/index.html`
4. Navegar por archivos con cobertura visual

#### ESLint Report
1. Descargar artifact `linting-reports`
2. Abrir `eslint-report.html` en navegador

#### Security Findings
1. Ir a `Security > Code scanning alerts`
2. Ver vulnerabilidades detectadas por CodeQL y Snyk

---

## Solución de Problemas

### Problemas Comunes

#### 1. Tests Fallan Localmente pero Pasan en CI
**Causa**: Diferencias en versiones de Node.js
**Solución**:
```bash
# Verificar versión
node --version  # Debe ser v20.x

# Usar nvm para cambiar versión
nvm use 20
npm ci
npm test
```

#### 2. ESLint Muestra Muchos Errores
**Causa**: Código no cumple con las reglas de seguridad
**Solución**:
```bash
# Ver errores
npm run lint

# Corregir automáticamente
npm run lint:fix

# Deshabilitar regla específica (NO RECOMENDADO)
# En .eslintrc.json cambiar "error" a "warn"
```

#### 3. Cobertura Baja
**Causa**: Faltan tests para ciertas funciones
**Solución**:
```bash
# Ver reporte detallado
npm run test:coverage

# Abrir reporte HTML
open coverage/index.html

# Agregar tests para archivos con baja cobertura
```

#### 4. Snyk/Semgrep No Funcionan
**Causa**: Faltan tokens en secrets
**Solución**:
1. Ir a Settings > Secrets
2. Agregar `SNYK_TOKEN` y `SEMGREP_APP_TOKEN`
3. Re-ejecutar workflow

#### 5. npm audit Muestra Vulnerabilidades
**Causa**: Dependencias desactualizadas o vulnerables
**Solución**:
```bash
# Ver vulnerabilidades
npm audit

# Corregir automáticamente (si es posible)
npm audit fix

# Forzar correcciones (puede romper compatibilidad)
npm audit fix --force

# Actualizar dependencia específica
npm update <package-name>
```

### Debugging del Pipeline

#### Ver Logs Detallados
1. Ir a Actions > Workflow Run
2. Click en el job que falló
3. Expandir el step con error
4. Copiar logs para análisis

#### Re-ejecutar Jobs Fallidos
1. En el workflow run, click "Re-run jobs"
2. Seleccionar "Re-run failed jobs"

#### Ejecutar Workflow Manualmente
1. Ir a Actions > CI/CD Pipeline
2. Click "Run workflow"
3. Seleccionar branch
4. Click "Run workflow"

---

## Mejores Prácticas

### Para Desarrolladores

1. **Ejecutar tests antes de commit**:
   ```bash
   npm run ci
   ```

2. **Mantener cobertura alta**:
   - Escribir tests para nuevas funciones
   - Seguir patrón BDD (Given-When-Then)

3. **Seguir reglas de linting**:
   - Usar `npm run lint:fix` regularmente
   - No deshabilitar reglas de seguridad

4. **Actualizar dependencias**:
   ```bash
   npm outdated
   npm update
   ```

### Para Mantenedores

1. **Revisar Security Alerts regularmente**
2. **Actualizar versiones de actions en workflows**
3. **Rotar tokens de Snyk/Semgrep anualmente**
4. **Revisar y ajustar umbrales de cobertura**

### Convenciones de Commits

Para mejor trazabilidad:
```
feat: Agregar nueva funcionalidad
fix: Corregir bug
test: Agregar o modificar tests
security: Corregir vulnerabilidad
refactor: Refactorizar código
docs: Actualizar documentación
ci: Cambios en pipeline CI/CD
```

---

## Roadmap Futuro

### Mejoras Planificadas

- [ ] Integración con SonarQube para análisis de calidad de código
- [ ] Performance testing con Lighthouse CI
- [ ] Dependency update automation con Dependabot
- [ ] Pre-commit hooks con Husky
- [ ] Mutation testing con Stryker
- [ ] E2E testing con Playwright/Cypress
- [ ] Docker image scanning con Trivy (ya implementado parcialmente)
- [ ] SBOM (Software Bill of Materials) generation

---

## Referencias

### Documentación Oficial
- ESLint: https://eslint.org/docs/latest/
- Jest: https://jestjs.io/docs/getting-started
- CodeQL: https://codeql.github.com/docs/
- Semgrep: https://semgrep.dev/docs/
- Snyk: https://docs.snyk.io/
- GitHub Actions: https://docs.github.com/en/actions

### Security Resources
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- CWE Top 25: https://cwe.mitre.org/top25/
- Node.js Security Best Practices: https://nodejs.org/en/docs/guides/security/

---

## Soporte

Para problemas o preguntas:
1. Revisar esta documentación
2. Consultar logs del pipeline en GitHub Actions
3. Revisar issues similares en el repositorio
4. Contactar al equipo de desarrollo

**Autor**: Roberth Cascante - Ingeniería en Sistemas
**Universidad**: Universidad Nacional de Costa Rica
**Campus**: Sede Regional Chorotega - Campus Nicoya
**Curso**: Seguridad Informática - Lab 5
**Profesor**: Ing. Alex Villegas Carranza, M.Sc.
