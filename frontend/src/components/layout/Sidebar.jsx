import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
    LayoutDashboard,
    Users,
    FolderClock,
    History,
    AlertTriangle,
    PieChart,
    Building2,
    Shapes,
    Percent,
    Shield,
    Plus,
    ClipboardList
} from 'lucide-react'
import logoYapDark from '../../assets/logo_yap_dark.png'
import logoYapLight from '../../assets/logo_yap_light.png'
import api from '../../utils/api'

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

const MenuLink = ({ to, icon: Icon, children, badge, badgeColor }) => {
    const location = useLocation()
    const isActive = location.pathname === to || (to !== '/inicio' && location.pathname.startsWith(to))
    const { vistaPremium } = useStore()

    return (
        <Link
            to={to}
            className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-500 relative overflow-hidden group mb-1.5",
                isActive
                    ? (vistaPremium
                        ? "text-white bg-gradient-to-r from-[rgba(26,111,255,0.15)] to-transparent shadow-[inset_0_0_20px_rgba(26,111,255,0.05)] border-l-2 border-[#1A6FFF]"
                        : "text-[#4FD1C5] bg-[#4FD1C5]/10 border-l-2 border-[#4FD1C5]")
                    : (vistaPremium
                        ? "text-[var(--texto-3)] hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                        : "text-gray-500 hover:text-[#4FD1C5] hover:bg-[#4FD1C5]/5 border-l-2 border-transparent")
            )}
        >
            <div className={cn(
                "p-2 rounded-xl transition-all duration-500 flex items-center justify-center",
                isActive
                    ? (vistaPremium ? "bg-[#1A6FFF]/20 text-[#00D4FF] glow-blue" : "bg-[#4FD1C5]/20 text-[#4FD1C5]")
                    : (vistaPremium ? "bg-white/5 text-[var(--texto-3)] group-hover:bg-white/10 group-hover:text-white" : "text-gray-400 group-hover:text-[#4FD1C5]")
            )}>
                <Icon className={cn("size-4 transition-transform duration-500", !isActive && "group-hover:scale-110")} />
            </div>

            <span className={cn(
                "text-[12.5px] font-bold tracking-tight transition-all duration-300",
                isActive ? "translate-x-0.5" : "opacity-80 group-hover:opacity-100"
            )}>
                {children}
            </span>

            {badge && (
                <span className={cn(
                    "ml-auto text-[9px] px-2 py-0.5 rounded-lg font-mono font-bold",
                    badgeColor === 'red'
                        ? "bg-[#F43F5E] text-white shadow-[0_0_12px_rgba(244,63,94,0.5)] animate-pulse"
                        : (vistaPremium ? "bg-[#1A6FFF] text-white shadow-[0_0_15px_rgba(26,111,255,0.4)]" : "bg-[#1A6FFF] text-white")
                )}>
                    {badge}
                </span>
            )}

            {isActive && vistaPremium && (
                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#1A6FFF]/10 to-transparent pointer-events-none"></div>
            )}
        </Link>
    )
}

const MenuDropdown = ({ title, children }) => {
    const { vistaPremium } = useStore()
    return (
        <div className="mb-4 mt-8">
            <div className="px-4 mb-4 flex items-center gap-3">
                <div className={cn("h-px flex-1", vistaPremium ? "bg-white/5" : "bg-gray-100")}></div>
                <div className={cn(
                    "text-[9px] font-black uppercase tracking-[0.3em]",
                    vistaPremium ? "text-[var(--texto-3)]" : "text-gray-400"
                )}>
                    {title}
                </div>
                <div className={cn("h-px w-4", vistaPremium ? "bg-white/5" : "bg-gray-100")}></div>
            </div>
            <div className="space-y-1">
                {children}
            </div>
        </div>
    )
}

export function Sidebar() {
    const { sidebarAbierta, vistaPremium, usuario } = useStore()
    const [config, setConfig] = useState(null)
    const [logoError, setLogoError] = useState(false)
    const [badges, setBadges] = useState({ prestamosActivos: null, cuotasEnMora: null })

    React.useEffect(() => {
        const cargar = async () => {
            try {
                const [configRes, statsRes] = await Promise.all([
                    api.get('/configuracion'),
                    api.get('/stats')
                ])
                setConfig(configRes.data.configuraciones)
                const s = statsRes.data.stats
                setBadges({
                    prestamosActivos: s?.prestamosActivos ?? null,
                    cuotasEnMora: s?.cuotasEnMora ?? null,
                })
            } catch (error) {
                console.error("Error al cargar sidebar", error)
            }
        }
        cargar()
    }, [])


    const logoDefault = vistaPremium ? logoYapDark : logoYapLight
    const logo = (!logoError && config?.logo_empresa) ? config.logo_empresa : logoDefault
    const nombreEmpresa = config?.nombre_empresa || "YAP (CRÉDITO POR LIBRANZA)"

    return (
        <aside className={cn(
            "flex-shrink-0 flex flex-col h-screen transition-all duration-300 z-40 overflow-hidden",
            sidebarAbierta ? "w-[260px]" : "w-0",
            vistaPremium ? "bg-[var(--fondo-principal)] border-r border-white/5 shadow-2xl" : "bg-white border-r border-gray-200"
        )}>
            {/* LOGO SECTION */}
            <div className="p-6 md:p-8 flex items-center gap-4 mb-4">
                <div className={cn(
                    "relative group/logo-container size-24 rounded-[32px] transition-all duration-700 flex items-center justify-center animate-glow-rotate p-[4px] shadow-[0_0_50px_rgba(79,209,197,0.2)]",
                    vistaPremium ? "bg-white/5" : "bg-slate-100"
                )}>
                    {/* Inner 3D Glass Layer */}
                    <div className="absolute inset-0 rounded-[32px] bg-gradient-to-tr from-white/10 to-transparent opacity-50 z-20 pointer-events-none border border-white/20"></div>
                    
                    <div className="w-full h-full rounded-[28px] overflow-hidden bg-[var(--fondo-principal)] flex items-center justify-center animate-logo-shimmer animate-laser-scan relative z-10 glass-effect border border-white/10 group-hover/logo-container:scale-105 transition-transform">
                        <img
                            src={logo}
                            alt="Logo"
                            className="w-full h-full object-cover animate-float-ultra filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]"
                            onError={() => setLogoError(true)}
                        />
                    </div>

                    {/* Pulse Rings */}
                    <div className="absolute -inset-2 border border-[var(--cyan)]/20 rounded-[40px] animate-ping opacity-20 pointer-events-none"></div>
                </div>
                <div>
                    <h1 className={cn(
                        "header-font font-black text-3xl leading-none tracking-tighter neural-glow",
                        vistaPremium ? "text-white" : "text-gray-900"
                    )}>
                        YAP
                    </h1>
                    <p className={cn(
                        "text-[10px] mt-1 font-black tracking-[0.25em] uppercase opacity-80",
                        vistaPremium ? "text-[var(--cyan)]" : "text-[#4FD1C5]"
                    )}>
                        Créditos por Libranza
                    </p>
                </div>
            </div>

            {/* Sidebar Navigation */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 space-y-2">
                <MenuLink to="/inicio" icon={LayoutDashboard}>Resumen de Cartera</MenuLink>
                <MenuLink to="/personas" icon={Users}>Directorio Clientes</MenuLink>
                <MenuLink
                    to="/prestamos"
                    icon={FolderClock}
                    badge={badges.prestamosActivos !== null ? String(badges.prestamosActivos) : undefined}
                >
                    Préstamos Activos
                </MenuLink>
                <MenuLink to="/historial" icon={History}>Evolución Mensual</MenuLink>
                <MenuLink
                    to="/mora"
                    icon={AlertTriangle}
                    badge={badges.cuotasEnMora !== null && badges.cuotasEnMora > 0 ? `${badges.cuotasEnMora}` : undefined}
                    badgeColor={badges.cuotasEnMora > 0 ? 'red' : undefined}
                >
                    Riesgo y Mora
                </MenuLink>
                <MenuLink to="/informes" icon={PieChart}>Analítica Profunda</MenuLink>

                <MenuDropdown title="Sistema">
                    <MenuLink to="/configuracion/empresas" icon={Building2}>Empresas</MenuLink>
                    <MenuLink to="/configuracion/tipos" icon={Shapes}>Tipologías</MenuLink>
                    <MenuLink to="/configuracion/tasas" icon={Percent}>Tasas de Interés</MenuLink>
                    <MenuLink to="/configuracion/usuarios" icon={Shield}>Gestión Usuarios</MenuLink>
                    <MenuLink to="/configuracion/auditoria" icon={ClipboardList}>Bitácora Auditoría</MenuLink>
                </MenuDropdown>
            </nav>

            {/* QUICK ACTION */}
            <div className="p-6 mt-auto">
                <Link
                    to="/prestamos"
                    state={{ openModal: true }}
                    className={cn(
                        "rounded-2xl p-4 flex flex-col items-center justify-center gap-3 text-center relative overflow-hidden group cursor-pointer transition-all duration-500",
                        vistaPremium
                            ? "bg-gradient-to-br from-[#1A6FFF]/10 to-[#00D4FF]/5 border border-white/5 hover:border-[#1A6FFF]/40 hover:shadow-[0_0_25px_rgba(26,111,255,0.2)]"
                            : "bg-[#4FD1C5]/5 border border-[#4FD1C5]/20 hover:border-[#4FD1C5] hover:shadow-lg"
                    )}
                >
                    {/* Animated Glow Background */}
                    <div className={cn(
                        "absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl",
                        vistaPremium ? "bg-gradient-to-r from-[#1A6FFF]/40 to-[#00D4FF]/40" : "bg-gradient-to-r from-blue-400/20 to-cyan-400/20"
                    )}></div>

                    <div className={cn(
                        "size-12 rounded-2xl flex items-center justify-center relative z-10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-90",
                        vistaPremium
                            ? "bg-gradient-to-br from-[#1A6FFF] to-[#00D4FF] shadow-[0_0_20px_rgba(26,111,255,0.5)] text-white"
                            : "bg-[#4FD1C5] text-white shadow-md shadow-teal-500/20"
                    )}>
                        <Plus className="w-6 h-6" />
                    </div>

                    <div className="relative z-10">
                        <p className={cn("text-sm font-black tracking-wide", vistaPremium ? "text-white" : "text-gray-900")}>Nuevo Préstamo</p>
                        <p className={cn(
                            "text-[9px] mt-0.5 uppercase tracking-[0.2em] font-bold opacity-60",
                            vistaPremium ? "text-[#00D4FF]" : "text-[#4FD1C5]"
                        )}>Acceso Rápido</p>
                    </div>

                    {/* Decorative element */}
                    {vistaPremium && (
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-[#1A6FFF]/20 transition-all duration-500"></div>
                    )}
                </Link>
            </div>

            {/* FOOTER SIGNATURE */}
            <div className="mt-auto px-8 pb-8 pt-4">
                <div className={cn(
                    "h-px w-10 mb-6",
                    vistaPremium ? "bg-white/5" : "bg-gray-100"
                )}></div>
                <p className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em]",
                    vistaPremium ? "text-white/20 hover:text-[var(--cyan)]" : "text-gray-300 hover:text-[#4FD1C5]",
                    "transition-colors duration-500 cursor-default"
                )}>
                    YAP v2.5.0
                </p>
                <p className={cn(
                    "text-[8px] font-bold uppercase tracking-widest mt-1 opacity-40",
                    vistaPremium ? "text-slate-500" : "text-gray-400"
                )}>
                    CRÉDITOS POR LIBRANZA
                </p>
            </div>
        </aside>
    )
}
