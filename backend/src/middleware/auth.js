import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import crypto from 'crypto'

// Para entornos locales sin configuración, generamos un secreto aleatorio único para la sesión del servidor
// Esto asegura seguridad total frente a ataques de forja externos
let jwtSecret = process.env.JWT_SECRET
if (!jwtSecret) {
    if (global.__jwtSecret) {
        jwtSecret = global.__jwtSecret
    } else {
        jwtSecret = crypto.randomBytes(32).toString('hex')
        global.__jwtSecret = jwtSecret
        console.warn('\n========================================================================')
        console.warn('⚠️  [ADVERTENCIA DE SEGURIDAD] process.env.JWT_SECRET no está configurado.')
        console.warn('Se ha generado un secreto de sesión dinámico aleatorio y seguro.')
        console.warn('Nota: Si el servidor se reinicia, las sesiones activas expirarán.')
        console.warn('========================================================================\n')
    }
}

export { jwtSecret }

export const verificarToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No autorizado. Se requiere token Bearer.' })
        }

        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, jwtSecret)

        // Buscar en BD
        const usuario = await prisma.usuario.findUnique({
            where: { id: decoded.id }
        })

        if (!usuario || usuario.estado !== 'activo') {
            return res.status(401).json({ error: 'Usuario no encontrado o inactivo.' })
        }

        // Remover password por seguridad
        const { password, ...usuarioSeguro } = usuario
        req.usuario = usuarioSeguro
        next()
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'El token ha expirado.' })
        }
        return res.status(401).json({ error: 'Token inválido.' })
    }
}

export const requiereRol = (rolesPermitidos = []) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ error: 'Usuario no autenticado.' })
        }

        // superadmin tiene acceso a todo
        if (req.usuario.rol === 'superadmin') {
            return next()
        }

        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ error: 'No tienes los permisos necesarios para realizar esta acción.' })
        }

        next()
    }
}
