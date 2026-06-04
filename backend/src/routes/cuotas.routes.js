import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { verificarToken } from '../middleware/auth.js'

const router = Router()

// Cuotas por préstamo
router.get('/prestamo/:id', verificarToken, async (req, res) => {
    try {
        const cuotas = await prisma.cuotaProgramada.findMany({
            where: { prestamo_id: req.params.id },
            orderBy: { numero_cuota: 'asc' }
        })
        res.json({ cuotas })
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener cuotas' })
    }
})

// Cuotas próximas (próximos 15 días)
router.get('/proximas', verificarToken, async (req, res) => {
    try {
        const hoy = new Date()
        const en15Dias = new Date()
        en15Dias.setDate(hoy.getDate() + 15)

        const cuotas = await prisma.cuotaProgramada.findMany({
            where: {
                estado: 'pendiente',
                fecha_programada: { gte: hoy, lte: en15Dias }
            },
            include: { prestamo: true, persona: true },
            orderBy: { fecha_programada: 'asc' }
        })
        res.json({ cuotas })
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener cuotas próximas' })
    }
})

// Cuotas vencidas
router.get('/vencidas', verificarToken, async (req, res) => {
    try {
        const cuotas = await prisma.cuotaProgramada.findMany({
            where: { estado: 'vencida' },
            include: { prestamo: true, persona: true },
            orderBy: { dias_de_atraso: 'desc' }
        })
        res.json({ cuotas })
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener cuotas vencidas' })
    }
})

export default router
