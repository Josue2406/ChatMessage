<h1 align="center">📋 Matriz de Riesgos – SBOM (Secure Software Development Life Cycle)</h1>

<p align="center">
  <b>Proyecto:</b> UNA-Chat (Lab 5 – Seguridad Informática) <br/>
  <b>Autor:</b> Roberth Cascante <br/>
  <b>Profesor:</b> Ing. Alex Villegas Carranza, M.Sc. <br/>
  <b>Periodo:</b> II Semestre 2025
</p>

---

<table>
  <thead>
    <tr>
      <th>Librería</th>
      <th>Versión</th>
      <th>Dependencia indirecta de</th>
      <th>Tipo de riesgo</th>
      <th>Prob.</th>
      <th>Impacto</th>
      <th>Riesgo Inherente</th>
      <th>Severidad</th>
      <th>Estado</th>
      <th>Recomendación</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>ws</b></td>
      <td>8.11.0</td>
      <td>socket.io@4.8.1</td>
      <td>Denial of Service (DoS)</td>
      <td>4</td>
      <td>4</td>
      <td><b>16</b></td>
      <td style="color:red; font-weight:bold;">🔴 Alta</td>
      <td><b>Activa</b></td>
      <td>Esperar actualización de <code>socket.io</code> o usar <code>resolutions</code></td>
    </tr>
    <tr>
      <td><b>socket.io</b></td>
      <td>4.8.1</td>
      <td>directa</td>
      <td>Usa <code>ws</code> vulnerable</td>
      <td>3</td>
      <td>3</td>
      <td><b>9</b></td>
      <td style="color:orange; font-weight:bold;">🟠 Media</td>
      <td>Pendiente</td>
      <td>Monitorear nuevas versiones</td>
    </tr>
    <tr>
      <td><b>express</b></td>
      <td>4.20.0</td>
      <td>directa</td>
      <td>Ninguna</td>
      <td>1</td>
      <td>2</td>
      <td><b>2</b></td>
      <td style="color:green; font-weight:bold;">🟢 Baja</td>
      <td>Mitigado</td>
      <td>OK</td>
    </tr>
    <tr>
      <td><b>jest</b></td>
      <td>29.7.0</td>
      <td>directa</td>
      <td>Ninguna</td>
      <td>1</td>
      <td>1</td>
      <td><b>1</b></td>
      <td style="color:green; font-weight:bold;">🟢 Baja</td>
      <td>Mitigado</td>
      <td>OK</td>
    </tr>
  </tbody>
</table>

---

<h3>🧮 Cálculo del riesgo</h3>

> **Riesgo Inherente = Probabilidad × Impacto**  
> Escala de evaluación:
>
> - 1–4 → <b style="color:green;">Bajo</b>
> - 5–9 → <b style="color:orange;">Medio</b>
> - 10–16 → <b style="color:red;">Alto</b>

---

<h3>🔍 Observaciones</h3>

- La vulnerabilidad <b>DoS en <code>ws@8.11.0</code></b> fue detectada mediante <b>Snyk CLI</b>.
- Es una <b>dependencia indirecta</b> proveniente de <code>socket.io@4.8.1</code>.
- No existe parche directo, por lo que se recomienda monitorear versiones nuevas de <code>socket.io</code> o forzar actualización con <code>npm resolutions</code>.
- Las demás dependencias (<code>express</code>, <code>jest</code>) están libres de vulnerabilidades conocidas.

---

<h3>🧩 Referencia de vulnerabilidad</h3>

- <b>ID:</b> <a href="https://security.snyk.io/vuln/SNYK-JS-WS-7266574" target="_blank">SNYK-JS-WS-7266574</a>
- <b>Tipo:</b> Denial of Service (DoS)
- <b>Versiones corregidas:</b> ≥ 8.17.1
- <b>CVSS Score:</b> Alto (7.5)
- <b>Fecha del análisis:</b> Octubre 2025

---

<h3>✅ Conclusión</h3>

El análisis realizado con <b>Snyk</b> confirma que el escaneo estático local detecta vulnerabilidades críticas dentro del ciclo <b>SSDLC</b>.  
La vulnerabilidad documentada en <code>ws@8.11.0</code> demuestra la importancia de la gestión de dependencias y la elaboración del <b>Software Bill of Materials (SBOM)</b> como práctica esencial de seguridad preventiva.
