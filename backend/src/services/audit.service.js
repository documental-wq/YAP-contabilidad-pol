import { prisma } from '../lib/prisma.js'

/**
 * Registra una acción administrativa o del sistema en la base de datos para auditoría.
 * 
 * @param {Object} params
 * @param {string} [params.usuarioId] - ID del usuario que realiza la acción (opcional para acciones del sistema)
 * @param {string} [params.usuarioNom] - Nombre del usuario o deudor
 * @param {string} params.accion - Tipo de acción (e.g., CREAR_PRESTAMO, REGISTRAR_PAGO)
 * @param {string} params.entidad - Entidad sobre la que se opera (e.g., Prestamo, Persona, RegistroPago)
 * @param {string} [params.entidadId] - ID de la entidad afectada
 * @param {Object|string} [params.detalles] - Información adicional o cambios
 */
export const registrarAccion = async ({ usuarioId, usuarioNom, accion, entidad, entidadId, detalles }) => {
    try {
        const detailsStr = detalles ? (typeof detalles === 'string' ? detalles : JSON.stringify(detalles)) : null
        
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
