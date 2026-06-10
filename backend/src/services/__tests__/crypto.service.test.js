// ============================================================
// Tests: crypto.service.js
// Cubre: cifrar, descifrar, cifrarPersona, descifrarPersona,
//        descifrarPersonas, y manejo de valores edge-case.
// ============================================================
import { describe, it, expect, beforeEach } from 'vitest'

// Configurar ENCRYPTION_KEY antes de importar el servicio
process.env.ENCRYPTION_KEY = 'a'.repeat(64) // 64 hex chars = 256 bits para tests

import {
    cifrar,
    descifrar,
    cifrarPersona,
    descifrarPersona,
    descifrarPersonas,
    generarHash
} from '../crypto.service.js'

describe('crypto.service — cifrar / descifrar', () => {
    it('debe cifrar y descifrar un string simple', () => {
        const original = 'Hola Mundo 123'
        const cifrado = cifrar(original)
        expect(cifrado).not.toBe(original)
        expect(descifrar(cifrado)).toBe(original)
    })

    it('cada cifrado produce un valor distinto (IV aleatorio)', () => {
        const texto = 'mismo texto'
        const c1 = cifrar(texto)
        const c2 = cifrar(texto)
        expect(c1).not.toBe(c2) // IVs distintos → ciphertexts distintos
        expect(descifrar(c1)).toBe(texto)
        expect(descifrar(c2)).toBe(texto)
    })

    it('debe cifrar números (los convierte a string)', () => {
        const num = 3123456789
        const cifrado = cifrar(num)
        expect(descifrar(cifrado)).toBe(String(num))
    })

    it('debe retornar null si la entrada es null', () => {
        expect(cifrar(null)).toBeNull()
        expect(descifrar(null)).toBeNull()
    })

    it('debe retornar undefined si la entrada es undefined', () => {
        expect(cifrar(undefined)).toBeUndefined()
        expect(descifrar(undefined)).toBeUndefined()
    })

    it('debe retornar string vacío si la entrada es string vacío', () => {
        expect(cifrar('')).toBe('')
        expect(descifrar('')).toBe('')
    })

    it('debe retornar el valor original si el texto cifrado no tiene formato iv:tag:datos', () => {
        const invalido = 'esto-no-esta-cifrado'
        expect(descifrar(invalido)).toBe(invalido)
    })

    it('debe cifrar y descifrar caracteres especiales y unicode', () => {
        const especial = '¡Cédula: 1.234.567-8 & correo@dominio.co — áéíóú'
        const cifrado = cifrar(especial)
        expect(descifrar(cifrado)).toBe(especial)
    })

    it('el texto cifrado tiene exactamente 3 partes separadas por ":"', () => {
        const cifrado = cifrar('test')
        const partes = cifrado.split(':')
        expect(partes).toHaveLength(3)
        // iv: 24 hex chars (12 bytes), tag: 32 hex chars (16 bytes)
        expect(partes[0]).toHaveLength(24)
        expect(partes[1]).toHaveLength(32)
    })

    it('debe lanzar un error si el ciphertext tiene 3 partes pero está alterado o corrupto', () => {
        const cifrado = cifrar('secreto')
        const partes = cifrado.split(':')
        // Alterar el ciphertext (parte 2)
        partes[2] = partes[2].slice(0, -2) + '00'
        const alterado = partes.join(':')
        expect(() => descifrar(alterado)).toThrow('Error al descifrar datos (firma o clave inválida)')
    })
})

describe('crypto.service — cifrarPersona / descifrarPersona', () => {
    const personaPlana = {
        id: 'test-id-001',
        primer_nombre: 'Carlos',
        primer_apellido: 'Ramirez',
        cedula: '12345678',
        telefono: '3001234567',
        telefono2: '6012345678',
        celular: '3219876543',
        correo: 'carlos@example.com',
        empresa_id: 'emp-1',
        estado: 'activo'
    }

    it('cifra los campos PII y deja el resto intacto', () => {
        const cifrada = cifrarPersona(personaPlana)

        // PII debe estar cifrado (distinto al original)
        expect(cifrada.cedula).not.toBe(personaPlana.cedula)
        expect(cifrada.telefono).not.toBe(personaPlana.telefono)
        expect(cifrada.telefono2).not.toBe(personaPlana.telefono2)
        expect(cifrada.celular).not.toBe(personaPlana.celular)
        expect(cifrada.correo).not.toBe(personaPlana.correo)

        // Hash determinístico generado
        expect(cifrada.cedula_hash).toBe(generarHash(personaPlana.cedula))

        // Non-PII debe permanecer igual
        expect(cifrada.id).toBe(personaPlana.id)
        expect(cifrada.primer_nombre).toBe(personaPlana.primer_nombre)
        expect(cifrada.estado).toBe(personaPlana.estado)
    })

    it('descifra correctamente después de cifrar', () => {
        const cifrada = cifrarPersona(personaPlana)
        const descifrada = descifrarPersona(cifrada)

        expect(descifrada.telefono).toBe(personaPlana.telefono)
        expect(descifrada.telefono2).toBe(personaPlana.telefono2)
        expect(descifrada.celular).toBe(personaPlana.celular)
        expect(descifrada.correo).toBe(personaPlana.correo)
        expect(descifrada.primer_nombre).toBe(personaPlana.primer_nombre)
    })

    it('maneja campos PII nulos correctamente (no lanza error)', () => {
        const personaConNulos = {
            id: 'x',
            primer_nombre: 'Test',
            cedula: '999',
            telefono: null,
            telefono2: undefined,
            celular: '',
            correo: null
        }
        expect(() => cifrarPersona(personaConNulos)).not.toThrow()
        const cifrada = cifrarPersona(personaConNulos)
        expect(() => descifrarPersona(cifrada)).not.toThrow()
        const descifrada = descifrarPersona(cifrada)
        expect(descifrada.telefono).toBeNull()
        expect(descifrada.celular).toBe('')
    })

    it('descifrarPersona(null) retorna null sin error', () => {
        expect(descifrarPersona(null)).toBeNull()
    })
})

describe('crypto.service — descifrarPersonas (array)', () => {
    it('descifra correctamente un array de personas', () => {
        const personas = [
            { id: '1', telefono: cifrar('300111'), celular: cifrar('310222'), correo: cifrar('a@b.co'), telefono2: null },
            { id: '2', telefono: cifrar('300333'), celular: cifrar('310444'), correo: null, telefono2: cifrar('old') }
        ]
        const descifradas = descifrarPersonas(personas)
        expect(descifradas[0].telefono).toBe('300111')
        expect(descifradas[0].celular).toBe('310222')
        expect(descifradas[0].correo).toBe('a@b.co')
        expect(descifradas[1].telefono).toBe('300333')
        expect(descifradas[1].telefono2).toBe('old')
    })

    it('retorna la entrada si no es un array', () => {
        expect(descifrarPersonas(null)).toBeNull()
        expect(descifrarPersonas('texto')).toBe('texto')
    })

    it('maneja array vacío sin error', () => {
        expect(descifrarPersonas([])).toEqual([])
    })
})
