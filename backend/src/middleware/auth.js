import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import crypto from 'crypto'

// ── Validación de secreto JWT al arranque ─────────────────────────────────
// En PRODUCCIÓN: si JWT_SECRET no está configurada, abortamos el proceso.
// Arrancar sin ella expone la app a forja de tokens y pérdida de sesiones.
let jwtSecret = process.env.JWT_SECRET

if (!jwtSecret) {
    if (process.env.NODE_ENV === 'production') {
        console.error('❌ [FATAL] JWT_SECRET no está configurada en producción.')
        console.error('   Configure la variable de entorno JWT_SECRET y reinicie el servidor.')
        process.exit(1)
    }

    // En desarrollo: secreto dinámico de sesión con advertencia visible
    if (global.__jwtSecret) {
        jwtSecret = global.__jwtSecret
    } else {
        jwtSecret = crypto.randomBytes(32).toString('hex')
        global.__jwtSecret = jwtSecret
        console.warn('\n========================================================================')
        console.warn('⚠️  [DEV] JWT_SECRET no configurada — usando secreto de sesión temporal.')
        console.warn('   Las sesiones expirarán si el servidor se reinicia.')
        console.warn('   Genere una clave con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"')
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
