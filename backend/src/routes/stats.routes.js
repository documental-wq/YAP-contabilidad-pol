import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { verificarToken, requiereRol } from '../middleware/auth.js'
import Decimal from 'decimal.js'
import { descifrarPersona, descifrarPersonas } from '../services/crypto.service.js'
import { createCache } from '../lib/cache.js'

const router = Router()

// ── Caché de 60 segundos para KPIs del dashboard ─────────────────────────────
// Evita 6+ queries pesadas por cada apertura del dashboard o pestaña nueva.
const statsCache = createCache(60_000)

// Endpoint de notificaciones en tiempo real para solicitudes pendientes y créditos por aprobar
router.get('/notificaciones', verificarToken, async (req, res) => {
    try {
        // 1. Solicitudes públicas: Personas con monto_requerido > 0 que no tienen préstamos
        const publicas = await prisma.persona.findMany({
            where: {
                monto_requerido: { gt: 0 },
                prestamos: { none: {} }
            },
            include: { empresa: true },
            orderBy: { fecha_registro: 'desc' }
        })

        // 2. Préstamos pendientes de aprobación
        const prestamosPendientes = await prisma.prestamo.findMany({
            where: { estado: 'pendiente_aprobacion' },
            include: { persona: true, tipo: true },
            orderBy: { createdAt: 'desc' }
        })

        // Descifrar la información PII de los clientes en las solicitudes
        const publicasDescifradas = descifrarPersonas(publicas)
        const prestamosPendientesDescifrados = prestamosPendientes.map(p => ({
            ...p,
            persona: p.persona ? descifrarPersona(p.persona) : null
        }))

        const totalCount = publicasDescifradas.length + prestamosPendientesDescifrados.length

        res.json({
            publicas: publicasDescifradas,
            prestamosPendientes: prestamosPendientesDescifrados,
            totalCount
        })
    } catch (error) {
        console.error('Error al obtener notificaciones:', error)
        res.status(500).json({ error: 'Error al obtener notificaciones' })
    }
})

// ── GET /api/stats — Solo lectura (sin side-effects) ─────────────────────────
// La detección y actualización de mora está en el cron de las 7 AM (cron.service.js).
// Si necesitas forzar la sincronización manualmente usa: POST /api/stats/sincronizar-mora
router.get('/', verificarToken, async (req, res) => {
    try {
        // Intentar responder desde caché (válido 60 segundos)
        const cached = statsCache.get('dashboard')
        if (cached) return res.json(cached)

        const hoy = new Date()

        // --- CÁLCULO DE ESTADÍSTICAS ---
        const [personasCount, prestamos, cuotasEnMoraAgg, pagosAgg] = await Promise.all([
            prisma.persona.count({ where: { estado: 'activo' } }),
            prisma.prestamo.findMany({
                where: { estado: { in: ['activo', 'en_mora'] } },
                include: { cuotas: { where: { estado: { in: ['pendiente', 'vencida'] } } } }
            }),
            prisma.cuotaProgramada.aggregate({
                where: { estado: 'vencida' },
                _sum: { cuota_total: true },
                _count: true
            }),
            prisma.registroPago.aggregate({
                _sum: { monto_pagado: true }
            })
        ])

        // Cartera Activa = suma real de cuotas pendientes (saldo vivo)
        const totalCartera = prestamos.reduce((acc, p) => {
            const pendiente = p.cuotas.reduce((sum, c) =>
                new Decimal(sum).plus(c.cuota_total).toNumber(), 0)
            return new Decimal(acc).plus(pendiente).toNumber()
        }, 0)

        const totalRecuperado = parseFloat(pagosAgg._sum.monto_pagado || 0)

        // --- EVOLUCIÓN (Últimos 6 meses) ---
        const hace6Meses = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1)
        const prestamosEvolucion = await prisma.prestamo.findMany({
            where: { createdAt: { gte: hace6Meses } },
            select: { createdAt: true, monto_otorgado: true }
        })

        const mesesLabel = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        const evolucionMap = {}
        for (let i = 5; i >= 0; i--) {
            const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
            const key = `${mesesLabel[d.getMonth()]} ${d.getFullYear()}`
            evolucionMap[key] = 0
        }

        prestamosEvolucion.forEach(p => {
            const d = new Date(p.createdAt)
            const key = `${mesesLabel[d.getMonth()]} ${d.getFullYear()}`
            if (evolucionMap[key] !== undefined) {
                evolucionMap[key] += parseFloat(p.monto_otorgado)
            }
        })

        const dataEvolucion = Object.entries(evolucionMap)
            .map(([name, capital]) => ({ name, capital }))

        // --- DISTRIBUCIÓN POR TIPOS ---
        const tipos = await prisma.tipoPrestamo.findMany({
            include: { _count: { select: { prestamos: true } } }
        })

        const maxCount = Math.max(...tipos.map(tx => tx._count.prestamos), 1)
        const dataRadar = tipos.map(t => ({
            subject: t.nombre,
            A: t._count.prestamos,
            fullMark: maxCount
        }))

        const resultado = {
            stats: {
                usuarios: personasCount,
                prestamosActivos: prestamos.length,
                totalCartera: Math.round(totalCartera),
                totalRecuperado: Math.round(totalRecuperado),
                cuotasEnMora: cuotasEnMoraAgg._count,
                valorEnMora: parseFloat(cuotasEnMoraAgg._sum.cuota_total || 0)
            },
            dataEvolucion,
            dataRadar
        }

        statsCache.set('dashboard', resultado)
        res.json(resultado)
    } catch (error) {
        console.error('Error al obtener estadísticas:', error)
        res.status(500).json({ error: 'Error al obtener estadísticas' })
    }
})

// ── POST /api/stats/sincronizar-mora — Detección manual de mora en tiempo real ─
// Separado del GET para respetar principio REST (GET no debe tener side-effects).
// Solo accesible por administradores; el dashboard puede llamarlo explícitamente.
router.post('/sincronizar-mora', verificarToken, requiereRol(['superadmin', 'administrador']), async (req, res) => {
    try {
        const hoy = new Date()

        const cuotasVencidasNow = await prisma.cuotaProgramada.findMany({
            where: {
                estado: 'pendiente',
                fecha_programada: { lt: hoy },
                prestamo: { estado: { in: ['activo', 'en_mora'] } }
            },
            include: { prestamo: true }
        })

        if (cuotasVencidasNow.length === 0) {
            statsCache.invalidate('dashboard')
            return res.json({ actualizadas: 0, enMora: 0, mensaje: 'Sin cuotas vencidas pendientes.' })
        }

        // Actualizar cuotas y préstamos en una sola transacción
        const updateCuotas = cuotasVencidasNow.map(c =>
            prisma.cuotaProgramada.update({ where: { id: c.id }, data: { estado: 'vencida' } })
        )
        const prestamoIdsAfectados = [...new Set(
            cuotasVencidasNow
                .filter(c => c.prestamo && c.prestamo.estado === 'activo')
                .map(c => c.prestamo_id)
        )]
        const updatePrestamos = prestamoIdsAfectados.map(pid =>
            prisma.prestamo.update({
                where: { id: pid },
                data: { estado: 'en_mora' }
            })
        )
        await prisma.$transaction([...updateCuotas, ...updatePrestamos])

        // Invalidar caché para que el próximo GET refleje los nuevos estados
        statsCache.invalidate('dashboard')

        res.json({
            actualizadas: cuotasVencidasNow.length,
            enMora: prestamoIdsAfectados.length,
            mensaje: `${cuotasVencidasNow.length} cuotas marcadas como vencidas. ${prestamoIdsAfectados.length} préstamos pasaron a en_mora.`
        })
    } catch (error) {
        console.error('Error al sincronizar mora:', error)
        res.status(500).json({ error: 'Error al sincronizar mora' })
    }
})

export default router
