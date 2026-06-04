import React, { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'
import { 
    Home, 
    TrendingUp, 
    History, 
    User, 
    LogOut, 
    ShieldAlert, 
    DollarSign,
    Compass
} from 'lucide-react'
import logoYap from '../../assets/logo_yap_dark.png'

export function PortalLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const [cliente, setCliente] = useState(null)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem('clienteToken')
        const usuarioData = localStorage.getItem('clienteUsuario')

        if (!token || !usuarioData) {
            localStorage.removeItem('clienteToken')
            localStorage.removeItem('clienteUsuario')
            navigate('/portal/login')
        } else {
            setCliente(JSON.parse(usuarioData))
        }

        // Monitorear scroll para efectos de cabecera
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setScrolled(true)
            } else {
                setScrolled(false)
            }
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [navigate])

    const handleLogout = () => {
        localStorage.removeItem('clienteToken')
        localStorage.removeItem('clienteUsuario')
        toast.success('Sesión cerrada correctamente.')
        navigate('/portal/login')
    }

    if (!cliente) return null

    const navItems = [
        { label: 'Inicio', path: '/portal/inicio', icon: Home },
        { label: 'Créditos', path: '/portal/prestamos', icon: TrendingUp },
        { label: 'Pagos', path: '/portal/pagos', icon: History },
        { label: 'Mi Perfil', path: '/portal/perfil', icon: User }
    ]

    return (
        <div className="min-h-screen bg-[#050B14] text-slate-100 flex flex-col font-sans select-none pb-20 md:pb-0 md:pl-64 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_-10%,rgba(0,212,255,0.06),rgba(0,0,0,0))] pointer-events-none" />
            <div className="absolute inset-0 grid-tactical-overlay opacity-10 pointer-events-none" />
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
                <img 
                    src="/src/assets/logo_yap_dark.png" 
                    alt="" 
                    className="w-[600px] h-[600px] object-contain opacity-[0.01] filter grayscale pointer-events-none"
                />
            </div>

            {/* TOASTER DE NOTIFICACIONES */}
            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        background: '#0a1224',
                        color: '#fff',
                        border: '1px solid rgba(0, 212, 255, 0.15)',
                        borderRadius: '16px',
                        fontSize: '13px',
                        fontWeight: '600'
                    }
                }}
            />

            {/* SIDEBAR PARA ESCRITORIO */}
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#080E1B] border-r border-white/[0.04] hidden md:flex flex-col z-30">
                {/* Logo */}
                <div className="p-6 border-b border-white/[0.04] flex items-center gap-3">
                    <img src={logoYap} alt="YAP Logo" className="h-8 object-contain" />
                    <div>
                        <span className="font-black text-xs uppercase tracking-wider text-white">PORTAL CLIENTES</span>
                    </div>
                </div>

                {/* Perfil del Cliente */}
                <div className="p-5 border-b border-white/[0.04] bg-white/[0.01] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1A6FFF] to-[#00D4FF] flex items-center justify-center text-sm font-black text-white uppercase shadow-inner border border-white/10 shrink-0">
                        {cliente.primer_nombre[0]}{cliente.primer_apellido[0]}
                    </div>
                    <div className="overflow-hidden">
                        <span className="block text-xs font-black text-white truncate">{cliente.nombre}</span>
                        <span className="block text-[9px] text-slate-500 font-mono mt-0.5 truncate">CC: {cliente.cedula}</span>
                    </div>
                </div>

                {/* Enlaces de Navegación */}
                <nav className="flex-1 p-4 space-y-1.5">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const activo = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                                    activo 
                                        ? 'bg-gradient-to-r from-[#1A6FFF]/15 to-[#00D4FF]/5 text-[#00D4FF] border-l-[3px] border-[#00D4FF]' 
                                        : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${activo ? 'text-[#00D4FF]' : ''}`} />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-white/[0.04]">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-red-400 hover:bg-red-500/10 transition-all duration-300 active:scale-[0.98]"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* TOP CABECERA MÓVIL Y ESCRITORIO */}
            <header className={`sticky top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-4 md:px-8 md:py-5 transition-all duration-300 ${
                scrolled ? 'bg-[#050B14]/90 backdrop-blur-md border-b border-white/[0.04] shadow-lg' : 'bg-transparent'
            }`}>
                <div className="flex items-center gap-2.5 md:hidden">
                    <img src={logoYap} alt="YAP Logo" className="h-7 object-contain" />
                </div>
                
                <div className="hidden md:block">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                        {location.pathname === '/portal/inicio' ? 'Panel de Control' :
                         location.pathname === '/portal/prestamos' ? 'Mis Préstamos' :
                         location.pathname === '/portal/pagos' ? 'Historial de Pagos' : 'Mi Perfil de Usuario'}
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    {/* Botón de Logout Rápido en Móvil */}
                    <button
                        onClick={handleLogout}
                        className="p-2 bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 rounded-xl md:hidden text-red-400 transition-colors duration-300"
                        title="Cerrar Sesión"
                    >
                        <LogOut className="w-4.5 h-4.5" />
                    </button>

                    {/* Badge de seguridad global */}
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[#0c1324] border border-[#00D4FF]/10 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">
                            PORTAL_CIFRADO_ACTIVO
                        </span>
                    </div>
                </div>
            </header>

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 p-4 md:p-8 max-w-[1200px] w-full mx-auto relative z-10">
                <Outlet />
            </main>

            {/* MENÚ INFERIOR TÁCTIL PARA MÓVILES */}
            <nav className="fixed bottom-0 left-0 right-0 bg-[#080E1B]/95 backdrop-blur-lg border-t border-white/[0.04] py-2 px-3 flex justify-around items-center z-30 md:hidden shadow-[0_-5px_25px_rgba(0,0,0,0.4)]">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const activo = location.pathname === item.path
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all duration-300 ${
                                activo ? 'text-[#00D4FF] scale-105' : 'text-slate-500'
                            }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-[8px] font-black uppercase tracking-wider">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
