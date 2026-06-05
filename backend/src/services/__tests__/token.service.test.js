// ============================================================
// Tests: token.service.js
// Cubre: generarTokens, renovarAccessToken, revocarRefreshToken,
//        limpiarTokensExpirados — usando mocks de Prisma y JWT.
// ============================================================
import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'

// ── Mock de Prisma (no usamos BD real en tests unitarios) ─────────────────
vi.mock('../../lib/prisma.js', () => ({
    prisma: {
        refreshToken: {
            create:     vi.fn(),
            findUnique: vi.fn(),
            delete:     vi.fn(),
            deleteMany: vi.fn()
        }
    }
}))

// ── Mock de jwtSecret desde auth.js ──────────────────────────────────────
vi.mock('../../middleware/auth.js', () => ({
    jwtSecret: 'test-secret-key-1234567890abcdef'
}))

import { prisma } from '../../lib/prisma.js'
import {
    generarTokens,
    renovarAccessToken,
    revocarRefreshToken,
    limpiarTokensExpirados
} from '../token.service.js'

// Helper: usuario de prueba
const usuarioTest = {
    id: 'user-test-001',
    nombre: 'Don Francisco',
    correo: 'don@coraza.co',
    rol: 'administrador',
    estado: 'activo',
    password: 'hashed'
}

beforeEach(() => {
    vi.clearAllMocks()
    prisma.refreshToken.create.mockResolvedValue({ id: 'rt-001', token: 'fake-token' })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('generarTokens', () => {
    it('retorna accessToken (JWT) y refreshToken (hex string)', async () => {
        const resultado = await generarTokens(usuarioTest)

        expect(resultado).toHaveProperty('accessToken')
        expect(resultado).toHaveProperty('refreshToken')
        expect(resultado).toHaveProperty('expiresIn')
        expect(typeof resultado.accessToken).toBe('string')
        expect(typeof resultado.refreshToken).toBe('string')
        // refreshToken debe ser hex largo (128 chars = 64 bytes)
        expect(resultado.refreshToken).toMatch(/^[a-f0-9]{128}$/)
    })

    it('el accessToken es un JWT válido con payload correcto', async () => {
        const { accessToken } = await generarTokens(usuarioTest)
        const payload = jwt.verify(accessToken, 'test-secret-key-1234567890abcdef')
        expect(payload.id).toBe(usuarioTest.id)
        expect(payload.rol).toBe(usuarioTest.rol)
    })

    it('llama a prisma.refreshToken.create con los datos correctos', async () => {
        await generarTokens(usuarioTest)

        expect(prisma.refreshToken.create).toHaveBeenCalledOnce()
        const createArg = prisma.refreshToken.create.mock.calls[0][0].data
        expect(createArg.usuario_id).toBe(usuarioTest.id)
        expect(createArg.token).toHaveLength(128) // 64 bytes hex
        expect(createArg.expires_at).toBeInstanceOf(Date)
        // Expira en ~30 días
        const diasRestantes = Math.round((createArg.expires_at - Date.now()) / (1000 * 60 * 60 * 24))
        expect(diasRestantes).toBeGreaterThanOrEqual(29)
        expect(diasRestantes).toBeLessThanOrEqual(30)
    })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('renovarAccessToken', () => {
    it('retorna null si refreshToken es null/undefined', async () => {
        expect(await renovarAccessToken(null)).toBeNull()
        expect(await renovarAccessToken(undefined)).toBeNull()
    })

    it('retorna null si el token no está en la BD', async () => {
        prisma.refreshToken.findUnique.mockResolvedValue(null)
        expect(await renovarAccessToken('token-invalido')).toBeNull()
    })

    it('retorna null y borra el token si está expirado', async () => {
        const expirado = new Date()
        expirado.setDate(expirado.getDate() - 1) // ayer

        prisma.refreshToken.findUnique.mockResolvedValue({
            id: 'rt-exp',
            token: 'viejo',
            expires_at: expirado,
            usuario: usuarioTest
        })
        prisma.refreshToken.delete.mockResolvedValue({})

        const resultado = await renovarAccessToken('viejo')
        expect(resultado).toBeNull()
        expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'rt-exp' } })
    })

    it('retorna null si el usuario está inactivo', async () => {
        const futuro = new Date()
        futuro.setDate(futuro.getDate() + 10)

        prisma.refreshToken.findUnique.mockResolvedValue({
            id: 'rt-002',
            token: 'activo',
            expires_at: futuro,
            usuario: { ...usuarioTest, estado: 'inactivo' }
        })

        const resultado = await renovarAccessToken('activo')
        expect(resultado).toBeNull()
    })

    it('retorna nuevo accessToken y usuario sin password si todo es válido', async () => {
        const futuro = new Date()
        futuro.setDate(futuro.getDate() + 15)

        prisma.refreshToken.findUnique.mockResolvedValue({
            id: 'rt-003',
            token: 'valido',
            expires_at: futuro,
            usuario: usuarioTest
        })

        const resultado = await renovarAccessToken('valido')
        expect(resultado).not.toBeNull()
        expect(resultado).toHaveProperty('accessToken')
        expect(resultado).toHaveProperty('usuario')
        // El objeto usuario NO debe incluir password
        expect(resultado.usuario).not.toHaveProperty('password')
        expect(resultado.usuario.id).toBe(usuarioTest.id)

        // Verificar que el JWT es válido
        const payload = jwt.verify(resultado.accessToken, 'test-secret-key-1234567890abcdef')
        expect(payload.id).toBe(usuarioTest.id)
    })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('revocarRefreshToken', () => {
    it('llama a deleteMany con el token correcto', async () => {
        prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 })
        await revocarRefreshToken('my-token')
        expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { token: 'my-token' } })
    })

    it('no hace nada si el token es nulo o undefined', async () => {
        await revocarRefreshToken(null)
        await revocarRefreshToken(undefined)
        expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled()
    })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('limpiarTokensExpirados', () => {
    it('retorna la cantidad de tokens eliminados', async () => {
        prisma.refreshToken.deleteMany.mockResolvedValue({ count: 5 })
        const eliminados = await limpiarTokensExpirados()
        expect(eliminados).toBe(5)
    })

    it('llama a deleteMany con expires_at < ahora', async () => {
        prisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 })
        await limpiarTokensExpirados()

        const callArg = prisma.refreshToken.deleteMany.mock.calls[0][0]
        expect(callArg.where.expires_at.lt).toBeInstanceOf(Date)
        // La fecha del filtro es pasado/presente, no futuro
        expect(callArg.where.expires_at.lt.getTime()).toBeLessThanOrEqual(Date.now() + 100)
    })
})
