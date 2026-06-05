import { create } from 'zustand'

// ── Seguridad de Tokens ───────────────────────────────────────────────────
// El access token vive SOLO en memoria (esta variable de módulo).
// El refresh token lo gestiona el backend como httpOnly cookie — JS NUNCA lo lee.
// usuario se guarda en localStorage (no es sensible como un token de sesión).
let _accessToken = null

export const useStore = create((set) => ({
    usuario: JSON.parse(localStorage.getItem('usuario')) || null,
    token: _accessToken, // En memoria, NO en localStorage

    login: (usuario, token) => {
        _accessToken = token
        localStorage.setItem('usuario', JSON.stringify(usuario))
        // refreshToken: gestionado exclusivamente por el backend en httpOnly cookie
        set({ usuario, token })
    },

    // Actualiza solo el access token (llamado por el interceptor de refresh)
    setToken: (token, usuario = null) => {
        _accessToken = token
        if (usuario) localStorage.setItem('usuario', JSON.stringify(usuario))
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
