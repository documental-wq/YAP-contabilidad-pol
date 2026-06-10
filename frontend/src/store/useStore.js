import { create } from 'zustand'

// ── Seguridad de Tokens ───────────────────────────────────────────────────
// El access token vive SOLO en memoria (esta variable de módulo).
// El refresh token lo gestiona el backend como httpOnly cookie — JS NUNCA lo lee.
// usuario se guarda en localStorage con timestamp de expiración de 8 horas.
let _accessToken = null

// ── Helper: leer usuario con validación de expiración ────────────────────
const leerUsuarioLocal = () => {
    try {
        const raw = localStorage.getItem('usuario')
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (parsed._expiresAt && Date.now() > parsed._expiresAt) {
            // Sesión de usuario expirada en localStorage — limpiar
            localStorage.removeItem('usuario')
            return null
        }
        const { _expiresAt, ...usuario } = parsed
        return usuario
    } catch {
        return null
    }
}

const guardarUsuarioLocal = (usuario) => {
    const conExpiracion = {
        ...usuario,
        _expiresAt: Date.now() + 8 * 60 * 60 * 1000 // 8 horas
    }
    localStorage.setItem('usuario', JSON.stringify(conExpiracion))
}

export const useStore = create((set) => ({
    usuario: leerUsuarioLocal(),
    token: _accessToken, // En memoria, NO en localStorage

    login: (usuario, token) => {
        _accessToken = token
        guardarUsuarioLocal(usuario)
        // refreshToken: gestionado exclusivamente por el backend en httpOnly cookie
        set({ usuario, token })
    },

    // Actualiza solo el access token (llamado por el interceptor de refresh)
    setToken: (token, usuario = null) => {
        _accessToken = token
        if (usuario) guardarUsuarioLocal(usuario)
        set((state) => ({
            token,
            usuario: usuario || state.usuario
        }))
    },

    logout: () => {
        _accessToken = null
        localStorage.removeItem('usuario')
        // La cookie yap_refresh se borra en el servidor al llamar /auth/logout
        set({ usuario: null, token: null })
    },

    // UI state
    sidebarAbierta: true,
    vistaPremium: true, // true = Premium (dark/glass), false = Standard (corporate/clean)
    notificaciones: [],   // Se cargan desde el backend al iniciar sesión
    atencionPendiente: 0,

    toggleSidebar: () => set((state) => ({ sidebarAbierta: !state.sidebarAbierta })),
    setVistaPremium: (valor) => set({ vistaPremium: valor }),
    limpiarNotificaciones: () => set({ notificaciones: [] }),
    eliminarNotificacion: (id) => set((state) => ({
        notificaciones: state.notificaciones.filter(n => n.id !== id)
    })),
    quitarAtencion: () => set((state) => ({
        atencionPendiente: Math.max(0, state.atencionPendiente - 1)
    }))
}))

