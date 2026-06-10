import { prisma } from '../lib/prisma.js'
import crypto from 'crypto'

// ── Hash de cédula para logs de auditoría ────────────────────────────────────
// La cédula es PII. En los logs guardamos un hash SHA-256 truncado que permite
// correlacionar eventos del mismo deudor sin exponer el número real.
// No usamos hash completo para ahorrar espacio y porque no es un secreto criptográfico.
const hashCedula = (cedula) => {
    if (!cedula) return null
    return `SHA:${crypto.createHash('sha256').update(String(cedula)).digest('hex').slice(0, 12)}`
}

/**
 * Sanitiza los detalles de auditoría reemplazando cédulas en texto plano por hash.
 * Acepta objetos con la propiedad `cedula` y la reemplaza de forma segura.
 */
const sanitizarDetalles = (detalles) => {
    if (!detalles || typeof detalles !== 'object') return detalles
    const sanitizado = { ...detalles }
    if (sanitizado.cedula) {
        sanitizado.cedula = hashCedula(sanitizado.cedula)
    }
    return sanitizado
}

/**
 * Registra una acción administrativa o del sistema en la base de datos para auditoría.
 * 
 * @param {Object} params
 * @param {string} [params.usuarioId] - ID del usuario que realiza la acción (opcional para acciones del sistema)
 * @param {string} [params.usuarioNom] - Nombre del usuario o deudor
 * @param {string} params.accion - Tipo de acción (e.g., CREAR_PRESTAMO, REGISTRAR_PAGO)
 * @param {string} params.entidad - Entidad sobre la que se opera (e.g., Prestamo, Persona, RegistroPago)
 * @param {string} [params.entidadId] - ID de la entidad afectada
 * @param {Object|string} [params.detalles] - Información adicional o cambios (cédulas son hasheadas automáticamente)
 */
export const registrarAccion = async ({ usuarioId, usuarioNom, accion, entidad, entidadId, detalles }) => {
    try {
        // Sanitizar cédulas antes de persistir
        const detallesSanitizados = sanitizarDetalles(detalles)
        const detailsStr = detallesSanitizados
            ? (typeof detallesSanitizados === 'string' ? detallesSanitizados : JSON.stringify(detallesSanitizados))
            : null
        
        const log = await prisma.auditLog.create({
            data: {
                usuario_id: usuarioId || null,
                usuario_nom: usuarioNom || 'Sistema',
                accion,
                entidad,
                entidad_id: entidadId ? String(entidadId) : null,
                detalles: detailsStr
            }
        })
        return log
    } catch (error) {
        console.error('[AuditService] Error al guardar bitácora de auditoría:', error.message)
    }
}
