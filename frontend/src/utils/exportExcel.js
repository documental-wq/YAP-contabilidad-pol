import * as XLSX from 'xlsx';

/**
 * Genera y descarga un archivo Excel (.xlsx) con el mismo contenido del PDF.
 *
 * @param {object} params
 * @param {string} params.title          - Título del reporte
 * @param {string} params.subtitle       - Subtítulo (nombre del empleado/vigilante)
 * @param {Array}  params.infoRows       - [{label, value}] — fila de metadatos
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

    // ── Encabezado ────────────────────────────────────────────────────────────
    const fechaHoy = new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
    }).toUpperCase();

    ws_data.push(['YAP (CRÉDITOS POR LIBRANZA)', '', '', 'FECHA DE GENERACIÓN:', fechaHoy]);
    ws_data.push([title]);
    if (subtitle) ws_data.push([subtitle]);
    ws_data.push([]); // fila vacía

    // ── Información general ────────────────────────────────────────────────────
    if (infoRows.length > 0) {
        ws_data.push(['INFORMACIÓN GENERAL']);
        infoRows.forEach(row => {
            ws_data.push([row.label ? row.label + ':' : '', row.value ?? '']);
        });
        ws_data.push([]);
    }

    // ── Detalle / tabla ────────────────────────────────────────────────────────
    ws_data.push(['DETALLE GENERAL DE OBLIGACIONES VIGENTES E HISTÓRICAS']);
    if (tableHeaders.length > 0) {
        ws_data.push(tableHeaders.map(h => h.label));
    }
    tableRows.forEach(row => {
        ws_data.push(row.map(cell => cell.value ?? ''));
    });
    ws_data.push([]);

    // ── Pie ────────────────────────────────────────────────────────────────────
    if (footerText) {
        ws_data.push([footerText]);
    }
    ws_data.push([]);
    ws_data.push(['Documento generado por el Sistema de Gestión YAP (CRÉDITOS POR LIBRANZA). Protegido bajo políticas de privacidad.']);

    // ── Construcción del sheet ─────────────────────────────────────────────────
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Calcular el ancho de las columnas de forma dinámica
    const maxCols = ws_data.reduce((max, row) => Math.max(max, row.length), 0);
    const colWidths = Array.from({ length: maxCols }, () => ({ wch: 12 })); // ancho base de 12

    ws_data.forEach(row => {
        row.forEach((val, colIdx) => {
            if (val !== null && val !== undefined && val !== '') {
                const len = String(val).length;
                if (len > colWidths[colIdx].wch) {
                    colWidths[colIdx].wch = Math.min(50, len + 3); // Capped at 50 chars, with 3 padding spaces
                }
            }
        });
    });

    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Reporte YAP');

    // ── Descarga ────────────────────────────────────────────────────────────────
    const safeFileName = fileName.replace(/[/\\?%*:|"<>]/g, '_');
    XLSX.writeFile(wb, `${safeFileName}.xlsx`);
}
