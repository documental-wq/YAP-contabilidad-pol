import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { jwtSecret } from './auth.js'
import { descifrarPersona } from '../services/crypto.service.js'

export const verificarTokenCliente = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No autorizado. Se requiere token.' })
        }

        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, jwtSecret)

        if (decoded.role !== 'cliente') {
            return res.status(403).json({ error: 'Acceso denegado. Rol inválido.' })
        }

        // Buscar a la persona en la base de datos
        const persona = await prisma.persona.findUnique({
            where: { id: decoded.id }
        })

        if (!persona || persona.estado !== 'activo') {
            return res.status(401).json({ error: 'Cliente no encontrado o inactivo.' })
        }

        // Descifrar campos sensibles (Habeas Data)
        const clienteDescifrado = descifrarPersona(persona)
        
        // Adjuntar datos del cliente a la petición
        req.cliente = clienteDescifrado
        next()
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Tu sesión ha expirado. Por favor ingresa nuevamente.' })
        }
        return res.status(401).json({ error: 'Sesión inválida.' })
    }
}
