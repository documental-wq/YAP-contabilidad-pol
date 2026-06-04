import React, { useState, useEffect } from 'react'
import { useStore } from '../../store/useStore'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, LogOut, Clock, Globe, ShieldCheck, Bell, RefreshCw, Check, X } from 'lucide-react'
import logoYapDark from '../../assets/logo_yap_dark.png'
import logoYapLight from '../../assets/logo_yap_light.png'
import toast from 'react-hot-toast'
import api, { isOffline } from '../../utils/api'

export function Topbar() {
    const {
        toggleSidebar, logout, vistaPremium, setVistaPremium
    } = useStore()
    const location = useLocation()
    const navigate = useNavigate()
    const [time, setTime] = useState(new Date())

    // Notificaciones en tiempo real para solicitudes y créditos
    const [notificaciones, setNotificaciones] = useState({ publicas: [], prestamosPendientes: [], totalCount: 0 })
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = React.useRef(null)

    const cargarNotificaciones = async () => {
        try {
            const res = await api.get('/stats/notificaciones')
            setNotificaciones(res.data || { publicas: [], prestamosPendientes: [], totalCount: 0 })
        } catch (e) {
            console.error("Error cargando notificaciones:", e)
        }
    }

    const rechazarSolicitud = async (id, nombre) => {
        const motivo = window.prompt(`¿Por qué deseas rechazar la solicitud de crédito de ${nombre}?\nIngresa un motivo (opcional):`)
        if (motivo === null) return // Clic en cancelar
        
        try {
            toast.loading("Descartando solicitud...", { id: 'rechazo' })
            await api.post(`/personas/${id}/rechazar-solicitud`, { motivo })
            toast.success("Solicitud descartada", { id: 'rechazo' })
            cargarNotificaciones()
        } catch (error) {
            console.error(error)
            toast.error("Error al descartar la solicitud", { id: 'rechazo' })
        }
    }

    useEffect(() => {
        const init = async () => {
            await cargarNotificaciones()
        }
        init()
        const timer = setInterval(() => setTime(new Date()), 1000)
        const notifTimer = setInterval(() => cargarNotificaciones(), 30000) // Cada 30s
        return () => {
            clearInterval(timer)
            clearInterval(notifTimer)
        }
    }, [])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const titles = {
        '/inicio': 'CARTERA',
        '/personas': 'CLIENTES',
        '/prestamos': 'PRÉSTAMOS',
        '/mora': 'RIESGO',
        '/configuracion': 'SISTEMA',
    }

    const getTitle = () => {
        const path = location.pathname
        for (const [key, val] of Object.entries(titles)) {
            if (path.startsWith(key)) return val
        }
        return 'YAP_CORE'
    }

    const offlineActive = isOffline()

    return (
        <header className="sticky top-0 z-40 flex h-28 items-center justify-center transition-all duration-500">
            <div className={`crystal-capsule flex items-center justify-between w-[95%] h-16 ${
                !vistaPremium ? 'bg-white/80' : 'premium-glass'
            }`}>
                <div className="flex items-center gap-6">
                    <button
                        onClick={toggleSidebar}
                        className={`md:hidden p-2 rounded-lg transition-colors ${vistaPremium ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="relative group logo-3d-container">
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur opacity-0 group-hover:opacity-60 transition duration-500 shadow-[0_0_20px_var(--cyan)]"></div>
                            <div className="size-11 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 relative overflow-hidden transition-transform duration-500 hover:scale-110">
                                <img 
                                    src={vistaPremium ? logoYapDark : logoYapLight} 
                                    alt="YAP" 
                                    className="w-full h-full object-cover" 
                                
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <h1 className={`text-lg font-black tracking-tighter leading-none ${
                                    vistaPremium ? 'text-white' : 'text-slate-900'
                                }`}>
                                    {getTitle()}
                                </h1>
                                <div className={`flex gap-1 h-3 items-center px-1.5 rounded-sm ${
                                    offlineActive ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-cyan-500/10 border border-cyan-500/20'
                                }`}>
                                    <span className={`text-[7px] font-mono font-bold uppercase tracking-widest ${
                                        offlineActive ? 'text-amber-400' : 'text-cyan-400 animate-pulse'
                                    }`}>
                                        {offlineActive ? 'Local' : 'Live'}
                                    </span>
                                </div>
                            </div>
                            <p className="text-[8px] text-slate-500 font-mono uppercase tracking-[0.3em]">Neural_Link_Stable</p>
                        </div>
                    </div>
                </div>

                {/* CENTRAL TELEMETRY SECTION */}
                <div className="hidden lg:flex items-center gap-8 translate-x-4">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            <span className="hud-clock">{time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                        </div>
                        <span className="text-[7px] font-black opacity-30 uppercase tracking-[0.2em]">Local_Precission_Time</span>
                    </div>

                    <div className="w-[1px] h-6 bg-white/10"></div>

                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] font-mono text-emerald-400 tracking-widest font-black uppercase">Secure_Vault</span>
                        </div>
                        <span className="text-[7px] font-black opacity-30 uppercase tracking-[0.2em]">Bit_Encryption_AES256</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setVistaPremium(!vistaPremium)}
                        className={`hidden md:flex px-4 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all duration-500 border ${
                            vistaPremium 
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20 shadow-[0_0_15px_rgba(0,212,255,0.2)]' 
                            : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                        }`}
                    >
                        {vistaPremium ? 'MODO OSCURO' : 'MODO CLARO'}
                    </button>

                    {/* Botón de Notificaciones */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className={`p-2.5 rounded-xl border transition-all duration-300 relative ${
                                vistaPremium 
                                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 shadow-[0_0_15px_rgba(0,212,255,0.15)]' 
                                : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 shadow-sm'
                            }`}
                            title="Notificaciones de Créditos"
                        >
                            <Bell className="w-5 h-5" />
                            {notificaciones.totalCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse border border-black shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                                    {notificaciones.totalCount}
                                </span>
                            )}
                        </button>

                        {/* Dropdown de Notificaciones */}
                        {dropdownOpen && (
                            <div className="absolute right-0 mt-3 w-80 md:w-96 rounded-2xl p-4 z-50 border border-white/10 premium-glass bg-[#0d1424]/95 shadow-[0_15px_50px_rgba(0,0,0,0.6)] animate-fade-in divide-y divide-white/5">
                                <div className="flex items-center justify-between pb-3 mb-2">
                                    <h3 className="text-xs font-black tracking-widest text-white uppercase flex items-center gap-1.5">
                                        <Bell className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>Solicitudes y Alertas</span>
                                    </h3>
                                    <button 
                                        onClick={cargarNotificaciones}
                                        className="text-[9px] text-cyan-400 hover:text-white font-bold transition-colors uppercase tracking-widest flex items-center gap-1"
                                    >
                                        <RefreshCw className="w-2.5 h-2.5" />
                                        Actualizar
                                    </button>
                                </div>

                                <div className="max-h-[300px] overflow-y-auto py-2 space-y-3" style={{ scrollbarWidth: 'none' }}>
                                    {notificaciones.totalCount === 0 ? (
                                        <div className="py-8 text-center text-slate-500 text-xs font-medium uppercase tracking-wider">
                                            No tienes solicitudes pendientes
                                        </div>
                                    ) : (
                                        <>
                                            {/* Solicitudes públicas */}
                                            {notificaciones.publicas.map(p => (
                                                <div key={p.id} className="flex flex-col gap-2 p-2 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors text-left">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <p className="text-xs font-bold text-white uppercase">{p.primer_nombre} {p.primer_apellido}</p>
                                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">CC: {p.cedula}</p>
                                                        </div>
                                                        <span className="text-[9px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Pública</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                                                        <span>Monto: <strong className="text-emerald-400 font-bold">{p.monto_requerido ? p.monto_requerido.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) : '-'}</strong></span>
                                                        <span className="italic truncate max-w-[150px]">{p.empresa?.nombre || 'Independiente'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 pt-1.5 border-t border-white/5">
                                                        <button
                                                            onClick={() => {
                                                                setDropdownOpen(false)
                                                                navigate('/prestamos', { state: { personaId: p.id } })
                                                            }}
                                                            className="flex-1 py-1 px-2.5 bg-cyan-500 text-black text-[9px] font-black rounded-lg uppercase tracking-wider hover:bg-white transition-all flex items-center justify-center gap-1"
                                                        >
                                                            <Check className="w-2.5 h-2.5" />
                                                            Procesar
                                                        </button>
                                                        <button
                                                            onClick={() => rechazarSolicitud(p.id, `${p.primer_nombre} ${p.primer_apellido}`)}
                                                            className="py-1 px-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-[9px] font-black rounded-lg uppercase tracking-wider transition-all flex items-center justify-center"
                                                            title="Descartar solicitud"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Préstamos por aprobar */}
                                            {notificaciones.prestamosPendientes.map(p => (
                                                <div key={p.id} className="flex flex-col gap-2 p-2 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors text-left">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <p className="text-xs font-bold text-white uppercase">{p.persona?.primer_nombre} {p.persona?.primer_apellido}</p>
                                                            <p className="text-[10px] text-cyan-400 font-mono mt-0.5">{p.codigo || 'Préstamo'}</p>
                                                        </div>
                                                        <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Por Aprobar</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                                                        <span>Monto: <strong className="text-white font-bold">{p.monto_otorgado ? p.monto_otorgado.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }) : '-'}</strong></span>
                                                        <span>Cuotas: <strong className="text-white font-bold">{p.numero_cuotas}</strong></span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 pt-1.5 border-t border-white/5">
                                                        <button
                                                            onClick={() => {
                                                                setDropdownOpen(false)
                                                                navigate('/prestamos')
                                                            }}
                                                            className="flex-1 py-1 px-2.5 bg-amber-500 text-black text-[9px] font-black rounded-lg uppercase tracking-wider hover:bg-white transition-all flex items-center justify-center gap-1"
                                                        >
                                                            Ver en Préstamos
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>

                                <div className="pt-2 text-center">
                                    <button 
                                        onClick={() => {
                                            setDropdownOpen(false)
                                            navigate('/personas')
                                        }}
                                        className="text-[9px] text-slate-400 hover:text-white uppercase tracking-widest font-black transition-colors"
                                    >
                                        Ver Directorio Completo
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-[1px] h-8 bg-white/10 hidden md:block"></div>

                    <button 
                        onClick={logout}
                        className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300 border border-rose-500/20 group relative overflow-hidden"
                    >
                        <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform relative z-10" />
                        <div className="absolute inset-0 bg-rose-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    </button>
                </div>
            </div>
        </header>
    )
}
