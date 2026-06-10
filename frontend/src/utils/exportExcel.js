import * as XLSX from 'xlsx';

/**
 * Genera y descarga un archivo Excel (.xlsx) con formato estructurado y limpio.
 *
 * @param {object} params
 * @param {string} params.title          - Título del reporte
 * @param {string} params.subtitle       - Subtítulo
 * @param {Array}  params.infoRows       - [{label, value}] — fila de metadatos (KPIs)
 * @param {Array}  params.tableHeaders   - [{label}]        — cabeceras de la tabla
 * @param {Array}  params.tableRows      - [[{value},...]]  — filas de datos
 * @param {string} params.footerText     - Texto del pie de reporte
 * @param {string} params.fileName       - Nombre del archivo (sin extensión)
 */
export function exportToExcel({
    title = 'Reporte',
    subtitle = '',
    infoRows = [],
    tableHeaders = [],
    tableRows = [],
    footerText = '',
    fileName = 'reporte_yap',
}) {
    const wb = XLSX.utils.book_new();
    const ws_data = [];

    // ── Encabezado principal ───────────────────────────────────────────────────
    const fechaHoy = new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
    }).toUpperCase();

    ws_data.push(['YAP — SISTEMA DE GESTIÓN DE CRÉDITOS POR LIBRANZA']);
    ws_data.push([title.toUpperCase()]);
    if (subtitle) {
        ws_data.push([subtitle.toUpperCase()]);
    }
    ws_data.push(['FECHA DE EMISIÓN:', fechaHoy]);
    ws_data.push([]); // Fila vacía de separación

    // ── Indicadores Clave de Gestión (KPIs) en distribución horizontal ─────────
    if (infoRows.length > 0) {
        ws_data.push(['INDICADORES CLAVE DE GESTIÓN (KPIs)']);
        // Fila de etiquetas en mayúscula
        ws_data.push(infoRows.map(row => (row.label ?? '').toUpperCase()));
        // Fila de valores correspondientes
        ws_data.push(infoRows.map(row => row.value ?? ''));
        ws_data.push([]); // Fila vacía de separación
    }

    // ── Detalle de la Tabla ────────────────────────────────────────────────────
    ws_data.push(['DETALLE CONSOLIDADO DE OBLIGACIONES']);
    if (tableHeaders.length > 0) {
        ws_data.push(tableHeaders.map(h => (h.label ?? '').toUpperCase()));
    }
    
    // Carga de filas de datos
    tableRows.forEach(row => {
        ws_data.push(row.map(cell => cell.value ?? ''));
    });
    ws_data.push([]); // Fila vacía

    // ── Pie de Reporte ─────────────────────────────────────────────────────────
    if (footerText) {
        ws_data.push([footerText.toUpperCase()]);
        ws_data.push([]);
    }
    ws_data.push(['Documento generado electrónicamente por el Sistema YAP.']);

    // ── Construcción del Sheet ─────────────────────────────────────────────────
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Calcular el ancho de las columnas de forma dinámica
    const maxCols = ws_data.reduce((max, row) => Math.max(max, row.length), 0);
    const colWidths = Array.from({ length: maxCols }, () => ({ wch: 12 })); // Ancho base de 12

    ws_data.forEach(row => {
        // Ignorar filas de título y de metadatos cortos (ej: longitud de fila <= 2)
        // para evitar que los títulos largos estiren excesivamente las primeras columnas.
        if (row.length <= 2) return;

        row.forEach((val, colIdx) => {
            if (val !== null && val !== undefined && val !== '') {
                const len = String(val).length;
                if (len > colWidths[colIdx].wch) {
                    colWidths[colIdx].wch = Math.min(50, len + 3); // Limitar a 50 de ancho, agregar 3 de espaciado
                }
            }
        });
    });

    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Reporte YAP');

    // ── Descarga del archivo ───────────────────────────────────────────────────
    const safeFileName = fileName.replace(/[/\\?%*:|"<>]/g, '_');
    XLSX.writeFile(wb, `${safeFileName}.xlsx`);
}
