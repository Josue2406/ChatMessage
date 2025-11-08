# GitHub Actions Workflows

Este directorio contiene los workflows de CI/CD para el proyecto.

## Workflows Disponibles

### 1. ci-pipeline.yml
**Pipeline Principal de CI/CD**

Este workflow implementa un pipeline completo con:
- ✅ Linting con ESLint
- ✅ Unit Tests con Jest (BDD)
- 🔒 SAST con CodeQL
- 🔒 SAST con Semgrep
- 🔒 SAST con Snyk
- 🔒 Dependency Security Check
- ✅ Quality Gate

**Triggers**:
- Push a ramas `main` y `dev`
- Pull Requests a ramas `main` y `dev`
- Ejecución manual

**Duración Estimada**: 5-8 minutos

**Requisitos**:
- Node.js 20
- Secrets (opcionales): `SNYK_TOKEN`, `SEMGREP_APP_TOKEN`

### 2. security-scan.yml
**Security Scan de Containers con Trivy**

Este workflow escanea la imagen Docker del proyecto en busca de vulnerabilidades.

**Triggers**:
- Push a ramas `main` y `dev`
- Pull Requests a ramas `main` y `dev`

**Duración Estimada**: 3-5 minutos

**Outputs**:
- Reporte JSON
- Reporte HTML navegable

## Configuración de Secrets

Para aprovechar todas las funcionalidades, configurar en `Settings > Secrets`:

| Secret | Descripción | Requerido | Obtención |
|--------|-------------|-----------|-----------|
| `SNYK_TOKEN` | Token de autenticación de Snyk | No | https://app.snyk.io/account |
| `SEMGREP_APP_TOKEN` | Token de Semgrep | No | https://semgrep.dev/manage/settings/tokens |
| `GITHUB_TOKEN` | Token automático de GitHub | Automático | Provisto por GitHub |

## Permisos Requeridos

Los workflows necesitan los siguientes permisos:

```yaml
permissions:
  actions: read
  contents: read
  security-events: write
```

Estos permisos permiten:
- Leer el código del repositorio
- Escribir alertas de seguridad en GitHub Security
- Subir artefactos

## Modificar Workflows

### Cambiar Ramas Monitoreadas

Editar en cada workflow:
```yaml
on:
  push:
    branches: [ "main", "dev", "staging" ]  # Agregar más ramas
  pull_request:
    branches: [ "main", "dev", "staging" ]
```

### Agregar Jobs Adicionales

1. Agregar nuevo job al final del archivo
2. Definir dependencias con `needs:`
3. Especificar steps

Ejemplo:
```yaml
  mi-nuevo-job:
    name: Mi Nuevo Job
    runs-on: ubuntu-latest
    needs: linting  # Espera a que linting termine
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Mi Step
        run: echo "Hola mundo"
```

### Deshabilitar Jobs

Para deshabilitar temporalmente un job sin borrarlo:
```yaml
  # mi-job:
  #   name: Mi Job
  #   runs-on: ubuntu-latest
  #   steps: ...
```

O agregar condición:
```yaml
  mi-job:
    name: Mi Job
    runs-on: ubuntu-latest
    if: false  # Nunca se ejecutará
```

## Troubleshooting

### El workflow no se ejecuta
- Verificar que el archivo esté en `.github/workflows/`
- Verificar sintaxis YAML (usar validador online)
- Verificar que los triggers coincidan con la rama/evento

### Jobs fallan con "Permission denied"
- Verificar permisos del workflow
- Verificar que los secrets estén configurados correctamente

### Timeout
- Aumentar timeout del job:
```yaml
jobs:
  mi-job:
    timeout-minutes: 30  # Default es 10
```

## Mejores Prácticas

1. **Nombrar jobs descriptivamente**
   ```yaml
   jobs:
     lint:  # ✅ Claro
       name: Code Quality - ESLint
   ```

2. **Usar cache para dependencias**
   ```yaml
   - uses: actions/setup-node@v4
     with:
       cache: 'npm'  # ✅ Cachea node_modules
   ```

3. **Continuar en error solo si es apropiado**
   ```yaml
   - name: Optional step
     run: npm run optional-task
     continue-on-error: true  # ⚠️ Usar con cuidado
   ```

4. **Versionar actions**
   ```yaml
   uses: actions/checkout@v4  # ✅ Versión específica
   # NO usar: uses: actions/checkout@main
   ```

## Recursos

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Actions Marketplace](https://github.com/marketplace?type=actions)
