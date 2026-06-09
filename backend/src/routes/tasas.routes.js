import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { verificarToken, requiereRol } from '../middleware/auth.js'

const router = Router()

// Obtener todas las tasas
router.get('/', verificarToken, async (req, res) => {
    try {
        const tasas = await prisma.tasaInteres.findMany({
            orderBy: { orden_en_tabla: 'asc' }
        })
        res.json({ tasas })
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener tasas' })
    }
})

// Obtener una tasa específica
router.get('/:id', verificarToken, async (req, res) => {
    try {
        const tasa = await prisma.tasaInteres.findUnique({
            where: { id: req.params.id }
        })
        if (!tasa) return res.status(404).json({ error: 'Tasa no encontrada' })
        res.json({ tasa })
    } catch (error) {
        res.status(500).json({ error: 'Error interno' })
    }
})

// Crear nueva tasa (dominio total, CUALQUIER NOMBRE, CUALQUIER %)
router.post('/', verificarToken, requiereRol(['superadmin', 'administrador']), async (req, res) => {
    try {
        const { nombre, descripcion, tipo_calculo, valor_porcentaje, valor_fijo, aplica_sobre, es_cargo_unico, es_tasa_mora, es_interes_principal, se_incluye_en_cuota, estado } = req.body
        const ultimaTasa = await prisma.tasaInteres.findFirst({
            orderBy: { orden_en_tabla: 'desc' }
        })
        const orden = (ultimaTasa?.orden_en_tabla || 0) + 1

        const nuevaTasa = await prisma.tasaInteres.create({
            data: {
                nombre,
                descripcion,
                tipo_calculo,
                valor_porcentaje: valor_porcentaje !== undefined ? parseFloat(valor_porcentaje) : 0,
                valor_fijo: valor_fijo !== undefined ? parseFloat(valor_fijo) : null,
                aplica_sobre,
                es_cargo_unico: es_cargo_unico !== undefined ? Boolean(es_cargo_unico) : undefined,
                es_tasa_mora: es_tasa_mora !== undefined ? Boolean(es_tasa_mora) : undefined,
                es_interes_principal: es_interes_principal !== undefined ? Boolean(es_interes_principal) : undefined,
                se_incluye_en_cuota: se_incluye_en_cuota !== undefined ? Boolean(se_incluye_en_cuota) : undefined,
                estado,
                orden_en_tabla: orden
            }
        })
        res.status(201).json({ mensaje: 'Tasa creada exitosamente', tasa: nuevaTasa })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error al crear la tasa' })
    }
})

// Editar tasa global.
// REGLA CRÍTICA: Editar una tasa global NO AFECTA a los préstamos que ya tengan su propio "Snapshot" guardado en PrestamTasa.
router.put('/:id', verificarToken, requiereRol(['superadmin', 'administrador']), async (req, res) => {
    try {
        const { nombre, descripcion, tipo_calculo, valor_porcentaje, valor_fijo, aplica_sobre, es_cargo_unico, es_tasa_mora, es_interes_principal, se_incluye_en_cuota, estado } = req.body
        const id = req.params.id

        const tasaEditada = await prisma.tasaInteres.update({
            where: { id },
            data: {
                nombre,
                descripcion,
                tipo_calculo,
                valor_porcentaje: valor_porcentaje !== undefined ? parseFloat(valor_porcentaje) : undefined,
                valor_fijo: valor_fijo !== undefined ? (valor_fijo === null ? null : parseFloat(valor_fijo)) : undefined,
                aplica_sobre,
                es_cargo_unico: es_cargo_unico !== undefined ? Boolean(es_cargo_unico) : undefined,
                es_tasa_mora: es_tasa_mora !== undefined ? Boolean(es_tasa_mora) : undefined,
                es_interes_principal: es_interes_principal !== undefined ? Boolean(es_interes_principal) : undefined,
                se_incluye_en_cuota: se_incluye_en_cuota !== undefined ? Boolean(se_incluye_en_cuota) : undefined,
                estado
            }
        })
        res.json({ mensaje: 'Tasa actualizada exitosamente (No afecta préstamos existentes)', tasa: tasaEditada })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error al editar tasa' })
    }
})

// Eliminar / Desactivar Tasa (Regla: Si hay préstamos activos -> Error)
router.delete('/:id', verificarToken, requiereRol(['superadmin']), async (req, res) => {
    try {
        const id = req.params.id

        // Validar si la tasa está asignada a préstamos o tipos de préstamos "vivos"
        const prestamosActivos = await prisma.prestamTasa.count({
            where: { tasa_id: id }
        })

        if (prestamosActivos > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar la tasa. Ya existe en préstamos emitidos. Intente desactivarla cambiando su estado.'
            })
        }

        await prisma.tasaInteres.delete({ where: { id } })
        res.json({ mensaje: 'Tasa eliminada del catálogo' })
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar' })
    }
})

// Reordenar tasas (Drag and drop)
router.post('/reordenar', verificarToken, requiereRol(['superadmin', 'administrador']), async (req, res) => {
    try {
        const ordenes = req.body // Array de objetos { id: String, orden_en_tabla: Int }

        // Transacción masiva
        const updates = ordenes.map((item) => {
            return prisma.tasaInteres.update({
                where: { id: item.id },
                data: { orden_en_tabla: item.orden_en_tabla }
            })
        })

        await prisma.$transaction(updates)
        res.json({ mensaje: 'Órdenes actualizadas' })
    } catch (error) {
        res.status(500).json({ error: 'Error al reordenar' })
    }
})

// GET /api/tasas/preview -> Será conectado con motor financiero próximamente
router.get('/preview', verificarToken, (req, res) => {
    res.json({ status: 'Implementación pendiente desde Motor Financiero (Fase 4)' })
})

export default router
