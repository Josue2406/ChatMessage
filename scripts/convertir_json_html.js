import fs from "fs";

// Validar argumentos
if (process.argv.length < 4) {
  console.error("Uso: node convertir_json_html.js <input.json> <output.html>");
  process.exit(1);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];

// Leer archivo JSON
let data;
try {
  const rawData = fs.readFileSync(inputFile, "utf8");
  data = JSON.parse(rawData);
} catch (error) {
  console.error("❌ Error al leer o parsear el archivo JSON:", error.message);
  process.exit(1);
}

// Generar estructura HTML
let html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Seguridad - Nuclei</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #0f172a;
      color: #e5e7eb;
      margin: 40px;
    }
    h1 {
      color: #38bdf8;
      text-align: center;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 10px;
      border-bottom: 1px solid #1e293b;
      text-align: left;
    }
    th {
      background-color: #1e293b;
      color: #f8fafc;
    }
    tr:nth-child(even) {
      background-color: #1e293b50;
    }
    .severity-critical { color: #f87171; font-weight: bold; }
    .severity-high { color: #fbbf24; font-weight: bold; }
    .severity-medium { color: #38bdf8; font-weight: bold; }
    .severity-low { color: #34d399; font-weight: bold; }
    .footer {
      text-align: center;
      margin-top: 40px;
      font-size: 0.9em;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <h1>Reporte de Seguridad - Nuclei</h1>
  <table>
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Severidad</th>
        <th>Template</th>
        <th>URL Detectada</th>
      </tr>
    </thead>
    <tbody>`;

// Si no hay resultados
if (!Array.isArray(data) || data.length === 0) {
  html += `
      <tr>
        <td colspan="4" style="text-align:center; color:#9ca3af;">
          ✅ No se detectaron vulnerabilidades en este escaneo.
        </td>
      </tr>`;
} else {
  for (const item of data) {
    const info = item.info || {};
    const name = info.name || "Sin nombre";
    const severity = (info.severity || "N/A").toLowerCase();
    const template = item.templateID || "N/A";
    const url = item["matched-at"] || "";

    html += `
      <tr>
        <td>${name}</td>
        <td class="severity-${severity}">${severity}</td>
        <td>${template}</td>
        <td>${url}</td>
      </tr>`;
  }
}

html += `
    </tbody>
  </table>
  <div class="footer">
    Generado automáticamente por Nuclei y GitHub Actions<br>
    © ${new Date().getFullYear()} ChatMessage Security Scan
  </div>
</body>
</html>`;

// Guardar HTML
try {
  fs.writeFileSync(outputFile, html, "utf8");
  console.log(`✅ Reporte HTML generado correctamente en: ${outputFile}`);
} catch (error) {
  console.error("❌ Error al guardar el HTML:", error.message);
  process.exit(1);
}
