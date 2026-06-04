import cron from 'node-cron'
import { prisma } from '../lib/prisma.js'
import { limpiarTokensExpirados } from './token.service.js'

export const iniciarCronJobs = () => {
    // Ejecutar todos los días a las 7 AM — Detección de mora
    cron.schedule('0 7 * * *', async () => {
        console.log('[CRON] Ejecutando detección de mora diaria...')
        try {
            const hoy = new Date()

            // CORRECCIÓN: Cuotas de préstamos activos o ya en mora (no cancelados)
            const pendientes = await prisma.cuotaProgramada.findMany({
                where: {
                    estado: 'pendiente',
                    fecha_programada: { lt: hoy },
                    prestamo: { estado: { in: ['activo', 'en_mora'] } }
                },
                include: { prestamo: true }
            })

            if (pendientes.length > 0) {
                console.log(`[CRON] ${pendientes.length} cuotas vencidas encontradas. Actualizando...`)

                for (const cuota of pendientes) {
                    // Marcar cuota como vencida
                    await prisma.cuotaProgramada.update({
                        where: { id: cuota.id },
                        data: { estado: 'vencida' }
                    })

                    // Pasar préstamo a en_mora SOLO si está activo
                    if (cuota.prestamo.estado === 'activo') {
                        await prisma.prestamo.update({
                            where: { id: cuota.prestamo_id },
                            data: { estado: 'en_mora' }
                        })
                    }
                }
                console.log(`[CRON] Mora actualizada para ${pendientes.length} cuotas.`)
            } else {
                console.log('[CRON] No se detectaron cuotas vencidas hoy.')
            }

        } catch (error) {
            console.error('[CRON] Error detectando mora:', error)
        }
    })

    // Recordatorios quincenales días 14 y 28 a las 8 AM
    cron.schedule('0 8 14,28 * *', async () => {
        console.log('[CRON] Ejecutando revisión de cuotas próximas a vencer...')
        try {
            const hoy = new Date()
            const en7Dias = new Date(hoy)
            en7Dias.setDate(hoy.getDate() + 7)

            // Cuotas que vencen en los próximos 7 días
            const proximasAVencer = await prisma.cuotaProgramada.findMany({
                where: {
                    estado: 'pendiente',
                    fecha_programada: { gte: hoy, lte: en7Dias }
                },
                include: { persona: true, prestamo: { include: { tipo: true } } }
            })

            console.log(`[CRON] ${proximasAVencer.length} cuotas vencen en los próximos 7 días.`)
            // TODO: Invocar email.service.js para enviar recordatorios cuando RESEND_API_KEY esté configurada
        } catch (err) {
            console.error('[CRON] Error en recordatorios:', err)
        }
    })

    // Verificación diaria a medianoche: limpiar préstamos en_mora que ya fueron pagados
    cron.schedule('0 0 * * *', async () => {
        console.log('[CRON] Verificando consistencia de estados de préstamos...')
        try {
            // Préstamos marcados como en_mora pero sin cuotas vencidas reales
            const enMoraConCuotasAlDia = await prisma.prestamo.findMany({
                where: { estado: 'en_mora' },
                include: {
                    cuotas: { where: { estado: 'vencida' } }
                }
            })

            let corregidos = 0
            for (const p of enMoraConCuotasAlDia) {
                if (p.cuotas.length === 0) {
                    await prisma.prestamo.update({
                        where: { id: p.id },
                        data: { estado: 'activo' }
                    })
                    corregidos++
                }
            }

            if (corregidos > 0) {
                console.log(`[CRON] ${corregidos} préstamos corregidos de en_mora a activo.`)
            }
        } catch (err) {
            console.error('[CRON] Error en verificación de consistencia:', err)
        }
    })

    // ── NUEVO: Limpieza de Refresh Tokens expirados (diario a las 3 AM) ────────
    cron.schedule('0 3 * * *', async () => {
        try {
            const eliminados = await limpiarTokensExpirados()
            if (eliminados > 0) {
                console.log(`[CRON] 🧹 ${eliminados} refresh tokens expirados eliminados de la BD.`)
            }
        } catch (err) {
            console.error('[CRON] Error limpiando tokens expirados:', err)
        }
    })

    console.log('⏳ Cron jobs inicializados correctamente (node-cron)')
}
