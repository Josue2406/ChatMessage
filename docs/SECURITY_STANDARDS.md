# 📘 Estándar de Desarrollo Seguro (UNA-Chat)

## 1. Buenas prácticas generales

- Usar nombres descriptivos (camelCase para variables, PascalCase para clases).
- Evitar contraseñas o tokens hardcodeados.
- Validar entradas de usuario (evitar inyección de código).
- Siempre ejecutar `npm run lint` y `npm run build` antes de hacer commit.
- Prohibido hacer `push` directo a main.
- Usar commits descriptivos: `feat:`, `fix:`, `test:`, `refactor:`, etc.

## 2. Prácticas para IA (agentes o asistentes)

- Siempre forzar que el código generado pase el lint.
- Seguir patrones de seguridad OWASP.
- No generar código que omita validaciones o excepciones.

## 3. Buenas prácticas BDD (Behavior Driven Development)

- Crear tests con descripciones de comportamiento: “should return error if user is not authenticated”.
- Mantener estructura de carpetas `/src`, `/tests`, `/config`.

## 4. Convenciones de equipo

- Formato de código: Prettier.
- Linter: ESLint.
- Seguridad: Snyk o Semgrep.

## 5. Vulnerabilidades encontradas (Snyk)

Durante el análisis con Snyk, se detectó la vulnerabilidad CVE en el paquete `ws@8.11.0`,
introducido por `socket.io@4.8.0`.
Tipo: Denial of Service (DoS). Severidad: Alta.
Actualmente en monitoreo hasta que la versión de socket.io libere una actualización estable
que elimine la dependencia vulnerable.

## 7. Vulnerabilidades detectadas (Snyk)

Durante el análisis local con Snyk se detectó una vulnerabilidad de Denial of Service (DoS)
en la librería `ws@8.11.0`, utilizada indirectamente por `socket.io@4.8.1`.
Esta vulnerabilidad tiene severidad **Alta (CVSS > 7.5)** y fue corregida en la versión `8.17.1`.

Actualmente se mantiene bajo monitoreo, ya que la dependencia es indirecta y
no existe parche directo en la versión de `socket.io` utilizada. Se recomienda
aplicar la política de gestión de riesgos y revisar actualizaciones periódicamente.
