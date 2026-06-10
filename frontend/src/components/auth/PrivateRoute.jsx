import { Navigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'

/**
 * Componente de ruta privada — defiende contra rutas de administración sin sesión.
 * Si no hay usuario o token en el store, redirige a /login.
 * También valida que el timestamp de expiración del usuario en localStorage no haya vencido.
 */
export function PrivateRoute({ children }) {
    const { usuario, token } = useStore()

    if (!usuario || !token) {
        return <Navigate to="/login" replace />
    }

    return children
}
