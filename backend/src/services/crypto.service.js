import crypto from 'crypto'

// ============================================================
// YAP - Servicio de Cifrado AES-256-GCM para PII
// Protege: cédulas, teléfonos, correos, cuentas bancarias
// Cumplimiento: Habeas Data (Ley 1581 Colombia)
// ============================================================

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32  // 256 bits
const IV_LENGTH  = 12  // 96 bits para GCM (óptimo)
const TAG_LENGTH = 16  // 128 bits auth tag

/**
 * Obtiene la llave de cifrado desde variables de entorno.
 * Si no está configurada, genera una advertencia y usa una llave de sesión.
 * EN PRODUCCIÓN: configure siempre ENCRYPTION_KEY en el archivo .env
 */
function obtenerLlave() {
    const keyHex = process.env.ENCRYPTION_KEY
    if (!keyHex) {
        if (process.env.NODE_ENV === 'production') {
            console.error('❌ [FATAL] ENCRYPTION_KEY no está configurada en producción.')
            console.error('   Sin esta clave, todos los datos PII cifrados serán irrecuperables.')
            console.error('   Genere una clave con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"')
            process.exit(1)
        }

        // En desarrollo: clave dinámica de sesión con advertencia visible
        if (!global.__encryptionKey) {
            global.__encryptionKey = crypto.randomBytes(KEY_LENGTH).toString('hex')
            console.warn('\n========================================================================')
            console.warn('⚠️  [DEV] ENCRYPTION_KEY no configurada — usando clave de sesión temporal.')
            console.warn('   Los datos cifrados NO serán recuperables si el servidor se reinicia.')
            console.warn('   Genere una clave con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"')
            console.warn('========================================================================\n')
        }
        return Buffer.from(global.__encryptionKey, 'hex')
    }
    if (keyHex.length !== 64) {
        throw new Error('[CryptoService] ENCRYPTION_KEY debe tener exactamente 64 caracteres hexadecimales (256 bits)')
    }
    return Buffer.from(keyHex, 'hex')
}

/**
 * Genera el hash SHA-256 determinístico de un texto.
 * Utilizado para indexación y unicidad en la base de datos sin exponer el dato.
 * 
 * @param {string|null|undefined} texto - El texto a hashear
 * @returns {string|null} - El hash hexadecimal de 64 caracteres
 */
export function generarHash(texto) {
    if (texto === null || texto === undefined || texto === '') return texto
    return crypto.createHash('sha256').update(String(texto).trim()).digest('hex')
}

/**
 * Cifra un string de texto plano usando AES-256-GCM.
 * El resultado es un string en formato: iv:authTag:ciphertext (todo en hex)
 * 
 * @param {string|null|undefined} texto - El texto a cifrar
 * @returns {string|null} - El texto cifrado o null si la entrada es nula
 */
export function cifrar(texto) {
    if (texto === null || texto === undefined || texto === '') return texto

    const llave = obtenerLlave()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, llave, iv, { authTagLength: TAG_LENGTH })

    const textoBuf = Buffer.from(String(texto), 'utf8')
    const cifradoBuf = Buffer.concat([cipher.update(textoBuf), cipher.final()])
    const authTag = cipher.getAuthTag()

    // Formato: iv:authTag:datos — todo en hexadecimal, separado por ':'
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${cifradoBuf.toString('hex')}`
}

/**
 * Descifra un string previamente cifrado con la función `cifrar`.
 * 
 * @param {string|null|undefined} textoCifrado - El texto a descifrar
 * @returns {string|null} - El texto original en claro, o null si la entrada es nula
 */
export function descifrar(textoCifrado) {
    if (textoCifrado === null || textoCifrado === undefined || textoCifrado === '') return textoCifrado

    // Si el valor no tiene el formato esperado (datos legacy o no cifrados), devuelve tal cual
    const partes = String(textoCifrado).split(':')
    if (partes.length !== 3) return textoCifrado

    try {
        const llave = obtenerLlave()
        const [ivHex, authTagHex, datosHex] = partes
        const iv = Buffer.from(ivHex, 'hex')
        const authTag = Buffer.from(authTagHex, 'hex')
        const datos = Buffer.from(datosHex, 'hex')

        const decipher = crypto.createDecipheriv(ALGORITHM, llave, iv, { authTagLength: TAG_LENGTH })
        decipher.setAuthTag(authTag)

        const descifradoBuf = Buffer.concat([decipher.update(datos), decipher.final()])
        return descifradoBuf.toString('utf8')
    } catch (err) {
        console.error('[CryptoService] Error al descifrar (posiblemente datos corruptos o llave incorrecta):', err.message)
        throw new Error('Error al descifrar datos (firma o clave inválida)')
    }
}

/**
 * Cifra todos los campos PII de un objeto persona antes de persistir en base de datos.
 * Solo cifra los campos que tienen valor (no nulos/vacíos).
 * 
 * @param {object} persona - Objeto con datos de la persona a cifrar
 * @returns {object} - Objeto con los campos sensibles cifrados
 */
export function cifrarPersona(persona) {
    return {
        ...persona,
        cedula:          cifrar(persona.cedula),
        cedula_hash:     generarHash(persona.cedula),
        telefono:        cifrar(persona.telefono),
        telefono2:       cifrar(persona.telefono2),
        celular:         cifrar(persona.celular),
        correo:          cifrar(persona.correo),
    }
}

/**
 * Descifra todos los campos PII de un objeto persona al leerlo de la base de datos.
 * Maneja transparentemente los datos legacy (no cifrados) sin lanzar errores.
 * 
 * @param {object} persona - Objeto con datos de la persona cifrados
 * @returns {object} - Objeto con los campos sensibles descifrados
 */
export function descifrarPersona(persona) {
    if (!persona) return persona
    return {
        ...persona,
        cedula:          descifrar(persona.cedula),
        telefono:        descifrar(persona.telefono),
        telefono2:       descifrar(persona.telefono2),
        celular:         descifrar(persona.celular),
        correo:          descifrar(persona.correo),
    }
}

/**
 * Descifra un array de personas.
 * 
 * @param {object[]} personas - Array de personas con datos cifrados
 * @returns {object[]} - Array de personas con datos descifrados
 */
export function descifrarPersonas(personas) {
    if (!Array.isArray(personas)) return personas
    return personas.map(descifrarPersona)
}
