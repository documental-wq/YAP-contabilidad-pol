// ── Caché en memoria con TTL ─────────────────────────────────────────────────
// Implementación mínima sin dependencias externas.
// Adecuado para KPIs del dashboard que toleran hasta 60 segundos de latencia.

class Cache {
    constructor(ttlMs) {
        this._ttlMs = ttlMs
        this._store = new Map()
    }

    get(key) {
        const entry = this._store.get(key)
        if (!entry) return null
        if (Date.now() > entry.expiresAt) {
            this._store.delete(key)
            return null
        }
        return entry.value
    }

    set(key, value) {
        this._store.set(key, {
            value,
            expiresAt: Date.now() + this._ttlMs
        })
    }

    invalidate(key) {
        this._store.delete(key)
    }

    clear() {
        this._store.clear()
    }
}

/**
 * Crea una instancia de caché en memoria con TTL configurable.
 * @param {number} ttlMs - Tiempo de vida en milisegundos (ej: 60_000 = 60 segundos)
 */
export const createCache = (ttlMs) => new Cache(ttlMs)
