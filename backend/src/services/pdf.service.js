/**
 * YAP - Servicio de generación de PDFs Liviano (Sin Puppeteer)
 * 
 * Este servicio reemplaza a Puppeteer que consumía 150-300MB de RAM por cada PDF.
 * Ahora los extractos de cuenta se generan en el SERVIDOR usando solo HTML + CSS
 * y se devuelven como respuesta JSON con el HTML listo para imprimir,
 * mientras que los PDFs complejos (amortizaciones) se generan en el CLIENTE
 * directamente desde el navegador con `react-to-print` (cero carga en servidor).
 * 
 * VENTAJAS:
 * - Ahorro del 100% de memoria RAM de Puppeteer
 * - Compatible con cualquier hosting (serverless, básico, etc.)
 * - El usuario imprime directamente desde su navegador (mayor calidad)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Genera el HTML del extracto de cuenta para que sea impreso por el cliente.
 * En lugar de renderizar con Chromium en el servidor, devuelve el HTML puro
 * para que el frontend lo abra en una nueva ventana e imprima directamente.
 * 
 * @param {string} htmlContent - HTML del extracto de cuenta
 * @param {string} nombreArchivo - Nombre del archivo (para referencia y almacenamiento local)
 * @returns {object} - Objeto con el HTML y el path local guardado
 */
export async function guardarExtractoHTML(htmlContent, nombreArchivo) {
    try {
        const uploadsDir = path.join(__dirname, '../../uploads/extractos')
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true })
        }

        const htmlFileName = nombreArchivo.replace('.pdf', '.html')
        const filePath = path.join(uploadsDir, htmlFileName)
        fs.writeFileSync(filePath, htmlContent, 'utf-8')

        console.log(`[PDFService] Extracto HTML guardado: uploads/extractos/${htmlFileName}`)
        return {
            localPath: `/uploads/extractos/${htmlFileName}`,
            htmlFileName
        }
    } catch (err) {
        console.error('[PDFService] Error guardando extracto HTML:', err.message)
        throw err
    }
}

/**
 * @deprecated Usar guardarExtractoHTML() en su lugar.
 * Se mantiene para compatibilidad con cualquier código existente.
 * Devuelve null en lugar de lanzar error para no romper flujos existentes.
 */
export async function generarPDFUrl(_url) {
    console.warn('[PDFService] generarPDFUrl() está obsoleto. Puppeteer fue removido para optimizar memoria.')
    return null
}

/**
 * @deprecated Usar guardarExtractoHTML() en su lugar.
 * Se mantiene para compatibilidad con cualquier código existente.
 * Devuelve null en lugar de lanzar error para no romper flujos existentes.
 */
export async function generarPDFHtml(htmlContent) {
    console.warn('[PDFService] generarPDFHtml() está obsoleto. Redirigiendo a guardarExtractoHTML().')
    const { localPath } = await guardarExtractoHTML(htmlContent, `extracto_${Date.now()}.html`)
    return null  // Ya no retorna Buffer - el cliente imprime directamente
}
