import React, { useState, useEffect } from 'react'
import apiCliente from '../utils/apiCliente'
import toast from 'react-hot-toast'
import { 
    DollarSign, 
    Calendar, 
    Clock, 
    TrendingUp, 
    ChevronRight, 
    ShieldCheck, 
    Loader2, 
    Info,
    Smartphone
} from 'lucide-react'

// Utilidad local para dar formato de moneda COP colombiana
const formatCOP = (valor) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor || 0)
}

// Utilidad local para formatear fecha de forma amigable
const formatFecha = (fechaString) => {
    if (!fechaString) return ''
    const fecha = new Date(fechaString)
    return new Intl.DateTimeFormat('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(fecha)
}

export function PortalDashboard() {
    const [datos, setDatos] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [cliente, setCliente] = useState(null)

    useEffect(() => {
        // Cargar datos de perfil del cliente
        const usuarioData = localStorage.getItem('clienteUsuario')
        if (usuarioData) {
            setCliente(JSON.parse(usuarioData))
        }

        // Cargar métricas del backend
        const cargarDashboard = async () => {
            try {
                const { data } = await apiCliente.get('/dashboard')
                setDatos(data)
            } catch (error) {
                console.error(error)
                toast.error('Error al cargar la información de tu crédito.')
            } finally {
                setCargando(false)
            }
        }
        cargarDashboard()
    }, [])

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 text-[#00D4FF] animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Sincronizando estado...</p>
            </div>
        )
    }

    const { resumen, proximoPago, prestamosRecientes } = datos || { 
        resumen: { totalOtorgado: 0, totalPagado: 0, saldoPendiente: 0, porcentajeProgreso: 0, prestamosActivos: 0 }, 
        proximoPago: null, 
        prestamosRecientes: [] 
    }

    // Determinar color de la alerta de vencimiento
    let alertaColor = 'border-[#00D4FF]/20 bg-[#00D4FF]/5 text-[#00D4FF]'
    let alertaBadge = 'bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/20'
    if (proximoPago) {
        if (proximoPago.dias_restantes < 0) {
            alertaColor = 'border-red-500/30 bg-red-500/5 text-red-400'
            alertaBadge = 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
        } else if (proximoPago.dias_restantes <= 3) {
            alertaColor = 'border-amber-500/30 bg-amber-500/5 text-amber-400'
            alertaBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        }
    }

    return (
        <div className="space-y-6">
            {/* Cabecera de bienvenida */}
            <div className="flex flex-col gap-1">
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-wide text-white">
                    Hola, {cliente?.primer_nombre || 'Cliente'} 👋
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                    Aquí tienes el estado consolidado de tus préstamos por libranza en tiempo real.
                </p>
            </div>

            {/* Panel Principal de Progreso y Vencimiento */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 1. Tarjeta Radial de Amortización (Lg: 5 col) */}
                <div className="lg:col-span-5 bg-[#0A111F]/80 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#00D4FF]/[0.02] to-transparent" />
                    
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">
                        Progreso de Pago
                    </h3>

                    {/* Gráfico circular hecho con SVG nativo */}
                    <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            {/* Círculo de fondo */}
                            <circle 
                                cx="50" 
                                cy="50" 
                                r="40" 
                                className="stroke-white/[0.04]" 
                                strokeWidth="8" 
                                fill="transparent" 
                            />
                            {/* Círculo de progreso cian neón */}
                            <circle 
                                cx="50" 
                                cy="50" 
                                r="40" 
                                className="stroke-[#00D4FF] transition-all duration-1000 ease-out" 
                                strokeWidth="8" 
                                fill="transparent" 
                                strokeDasharray={2 * Math.PI * 40}
                                strokeDashoffset={2 * Math.PI * 40 * (1 - resumen.porcentajeProgreso / 100)}
                                strokeLinecap="round"
                                style={{
                                    filter: 'drop-shadow(0 0 8px rgba(0, 212, 255, 0.4))'
                                }}
                            />
                        </svg>
                        
                        {/* Texto centrado del porcentaje */}
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-3xl font-black tracking-tight text-white">
                                {resumen.porcentajeProgreso}%
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Amortizado
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 space-y-1">
                        <p className="text-xs font-bold text-slate-300">
                            Has pagado {formatCOP(resumen.totalPagado)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            de un total de {formatCOP(resumen.totalOtorgado + (resumen.totalOtorgado * 0.15))}
                        </p>
                    </div>
                </div>

                {/* 2. Próximo Pago Programado (Lg: 7 col) */}
                <div className="lg:col-span-7 flex flex-col justify-between bg-[#0A111F]/80 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1A6FFF]/[0.02] to-transparent pointer-events-none" />
                    
                    <div className="flex items-center justify-between border-b border-white/[0.04] pb-4 mb-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Próxima Cuota Programada
                        </h3>
                        <div className="w-8 h-8 bg-white/[0.02] rounded-xl flex items-center justify-center text-[#00D4FF] border border-white/[0.04]">
                            <Calendar className="w-4 h-4" />
                        </div>
                    </div>

                    {proximoPago ? (
                        <div className="flex-1 flex flex-col justify-center space-y-5 py-2">
                            {/* Alerta de días restantes */}
                            <div className={`border rounded-2xl p-4 flex items-center gap-3.5 ${alertaColor}`}>
                                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-slate-400">Estado de pago</span>
                                    <span className="block text-xs font-black uppercase tracking-wider mt-0.5">
                                        {proximoPago.dias_restantes < 0 
                                            ? `Atrasado por ${Math.abs(proximoPago.dias_restantes)} días` 
                                            : proximoPago.dias_restantes === 0 
                                            ? '¡Tu pago se descuenta HOY!' 
                                            : `Faltan ${proximoPago.dias_restantes} días para el descuento`}
                                    </span>
                                </div>
                            </div>

                            {/* Detalle de cuota */}
                            <div className="flex items-end justify-between">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        Cuota N° {proximoPago.numero_cuota}
                                    </span>
                                    <span className="block text-3xl font-black tracking-tight text-white">
                                        {formatCOP(proximoPago.monto)}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        Fecha de Descuento
                                    </span>
                                    <span className="block text-sm font-bold text-slate-200 mt-1">
                                        {formatFecha(proximoPago.fecha)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 space-y-3">
                            <ShieldCheck className="w-12 h-12 text-[#10B981] drop-shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse" />
                            <div>
                                <p className="text-sm font-black text-white uppercase tracking-wider">¡Al día con YAP!</p>
                                <p className="text-xs text-slate-500 font-medium max-w-[280px] mx-auto mt-1">
                                    No tienes cuotas programadas pendientes en este momento.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="border-t border-white/[0.04] pt-4 mt-4 flex items-center gap-2">
                        <Info className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                            Este valor será descontado automáticamente de tu nómina.
                        </span>
                    </div>
                </div>
            </div>

            {/* Grid de KPIs Consolidados */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Saldo Pendiente */}
                <div className="bg-[#0A111F]/80 border border-white/[0.06] rounded-3xl p-5 shadow-md flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-red-500/[0.01] group-hover:bg-red-500/[0.02] transition-colors duration-300 pointer-events-none" />
                    <div className="w-12 h-12 bg-red-500/5 rounded-2xl flex items-center justify-center border border-red-500/10 text-red-400 shadow-inner shrink-0">
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Saldo Pendiente</span>
                        <span className="block text-lg font-black text-white mt-1 group-hover:text-[#00D4FF] transition-colors duration-300">
                            {formatCOP(resumen.saldoPendiente)}
                        </span>
                    </div>
                </div>

                {/* Total Descontado */}
                <div className="bg-[#0A111F]/80 border border-white/[0.06] rounded-3xl p-5 shadow-md flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-emerald-500/[0.01] group-hover:bg-emerald-500/[0.02] transition-colors duration-300 pointer-events-none" />
                    <div className="w-12 h-12 bg-emerald-500/5 rounded-2xl flex items-center justify-center border border-emerald-500/10 text-emerald-400 shadow-inner shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Total Pagado</span>
                        <span className="block text-lg font-black text-white mt-1 group-hover:text-emerald-400 transition-colors duration-300">
                            {formatCOP(resumen.totalPagado)}
                        </span>
                    </div>
                </div>

                {/* Préstamos Activos */}
                <div className="bg-[#0A111F]/80 border border-white/[0.06] rounded-3xl p-5 shadow-md flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-500/[0.01] group-hover:bg-blue-500/[0.02] transition-colors duration-300 pointer-events-none" />
                    <div className="w-12 h-12 bg-blue-500/5 rounded-2xl flex items-center justify-center border border-blue-500/10 text-blue-400 shadow-inner shrink-0">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Préstamos Activos</span>
                        <span className="block text-lg font-black text-white mt-1 group-hover:text-blue-400 transition-colors duration-300">
                            {resumen.prestamosActivos} Activos <span className="text-[10px] text-slate-500 font-bold">/ {resumen.prestamosTotales} en total</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Listado de Préstamos Recientes */}
            <div className="bg-[#0A111F]/80 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-5 md:p-6 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/[0.04] pb-4 mb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">
                        Tus Préstamos Recientes
                    </h3>
                </div>

                {prestamosRecientes.length > 0 ? (
                    <div className="divide-y divide-white/[0.03]">
                        {prestamosRecientes.map((p) => {
                            let badgeStyle = 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            let estadoTexto = p.estado
                            
                            if (p.estado === 'activo') {
                                badgeStyle = 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                                estadoTexto = 'Activo'
                            } else if (p.estado === 'en_mora') {
                                badgeStyle = 'bg-red-500/15 text-red-400 border-red-500/30'
                                estadoTexto = 'En Mora'
                            } else if (p.estado === 'pendiente_aprobacion') {
                                badgeStyle = 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                estadoTexto = 'Estudio Técnico'
                            } else if (p.estado === 'finalizado') {
                                badgeStyle = 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                                estadoTexto = 'Cancelado'
                            }

                            return (
                                <div key={p.id} className="py-4 flex items-center justify-between group hover:bg-white/[0.005] px-2 rounded-xl transition-all duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-center justify-center text-xs font-black tracking-tighter text-[#00D4FF]">
                                            CR
                                        </div>
                                        <div>
                                            <span className="block text-xs font-black text-white">
                                                Crédito {p.codigo || 'N/A'}
                                            </span>
                                            <span className="block text-[9px] font-mono text-slate-500 mt-0.5">
                                                Fecha: {formatFecha(p.fecha_otorgado || p.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <span className="block text-xs font-black text-white">
                                                {formatCOP(p.monto)}
                                            </span>
                                            <span className={`inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border mt-1 ${badgeStyle}`}>
                                                {estadoTexto}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">No tienes préstamos registrados</p>
                    </div>
                )}
            </div>
        </div>
    )
}
