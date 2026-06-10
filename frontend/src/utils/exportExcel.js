import * as XLSX from 'xlsx';

/**
 * Genera y descarga un archivo Excel (.xlsx) bien estructurado.
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
    const ws_data = [];

    const fechaHoy = new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
    }).toUpperCase();

    // ── Cabecera ────────────────────────────────────────────────────────────────
    ws_data.push(['YAP — SISTEMA DE GESTIÓN DE CRÉDITOS POR LIBRANZA']);
    ws_data.push([title.toUpperCase()]);
    if (subtitle) {
        ws_data.push([subtitle.toUpperCase()]);
    }
    ws_data.push(['FECHA DE EMISIÓN:', fechaHoy]);
    ws_data.push([]); // Fila vacía de separación

    // ── KPIs ────────────────────────────────────────────────────────────────────
    if (infoRows.length > 0) {
        ws_data.push(['INDICADORES CLAVE DE GESTIÓN (KPIs)']);
        ws_data.push(infoRows.map(row => (row.label ?? '').toUpperCase()));
        ws_data.push(infoRows.map(row => row.value ?? ''));
        ws_data.push([]); // Fila vacía de separación
    }

    // ── Tabla de obligaciones ───────────────────────────────────────────────────
    ws_data.push(['DETALLE CONSOLIDADO DE OBLIGACIONES']);
    if (tableHeaders.length > 0) {
        ws_data.push(tableHeaders.map(h => (h.label ?? '').toUpperCase()));
    }

    tableRows.forEach(row => {
        ws_data.push(row.map(cell => {
            const val = cell.value ?? '';
            // Intentar convertir valores monetarios a números reales
            if (typeof val === 'string' && val.includes('$')) {
                const cleaned = val.replace(/[^\d.-]/g, '');
                const num = parseFloat(cleaned);
                return isNaN(num) ? val : num;
            }
            return val;
        }));
    });

    ws_data.push([]); // Fila vacía de separación

    // ── Footer ──────────────────────────────────────────────────────────────────
    if (footerText) {
        ws_data.push([footerText.toUpperCase()]);
        ws_data.push([]);
    }
    ws_data.push(['Documento generado electrónicamente por el Sistema YAP.']);

    // ── Construcción de la hoja ─────────────────────────────────────────────────
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // ── Ancho dinámico de columnas ──────────────────────────────────────────────
    const maxCols = ws_data.reduce((acc, row) => Math.max(acc, row.length), 0);
    const colWidths = Array.from({ length: maxCols }, () => ({ wch: 14 }));

    ws_data.forEach(row => {
        if (row.length <= 2) return; // Ignorar filas de título/sección
        row.forEach((val, colIdx) => {
            if (val !== null && val !== undefined && val !== '') {
                const len = String(val).length;
                if (colIdx < colWidths.length && len > colWidths[colIdx].wch) {
                    colWidths[colIdx].wch = Math.min(50, len + 3);
                }
            }
        });
    });

    ws['!cols'] = colWidths;

    // Marcar la fila de cabeceras de la tabla para formato especial
    // (xlsx base no soporta estilos individuales, pero sí formato de números)
    // Aplicar formato de número a celdas monetarias en la hoja
    for (const cellAddr in ws) {
        if (cellAddr.startsWith('!')) continue;
        const cell = ws[cellAddr];
        if (cell.t === 'n' && typeof cell.v === 'number' && cell.v > 1000) {
            cell.z = '"$"#,##0'; // Formato de moneda colombiana
        }
    }

    // ── Libro de trabajo ────────────────────────────────────────────────────────
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte YAP');

    // ── Descarga ────────────────────────────────────────────────────────────────
    const safeFileName = fileName.replace(/[/\\?%*:|"<>]/g, '_');
    XLSX.writeFile(wb, `${safeFileName}.xlsx`);
}
