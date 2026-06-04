import React, { useState, useEffect } from 'react'
import apiCliente from '../utils/apiCliente'
import toast from 'react-hot-toast'
import { 
    ChevronDown, 
    ChevronUp, 
    Calendar, 
    DollarSign, 
    FileText, 
    CheckCircle, 
    Clock, 
    AlertCircle, 
    Loader2 
} from 'lucide-react'

// Utilidad local para formato COP
const formatCOP = (valor) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor || 0)
}

// Utilidad local para fechas
const formatFecha = (fechaString) => {
    if (!fechaString) return ''
    const fecha = new Date(fechaString)
    return new Intl.DateTimeFormat('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(fecha)
}

export function PortalPrestamos() {
    const [prestamos, setPrestamos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [abiertoId, setAbiertoId] = useState(null)

    useEffect(() => {
        const cargarPrestamos = async () => {
            try {
                const { data } = await apiCliente.get('/prestamos')
                setPrestamos(data.prestamos || [])
                if (data.prestamos?.length > 0) {
                    setAbiertoId(data.prestamos[0].id) // Abrir el primero por defecto
                }
            } catch (error) {
                console.error(error)
                toast.error('Error al cargar tus créditos.')
            } finally {
                setCargando(false)
            }
        }
        cargarPrestamos()
    }, [])

    const toggleAccordion = (id) => {
        setAbiertoId(abiertoId === id ? null : id)
    }

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 text-[#00D4FF] animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Cargando amortizaciones...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-wide text-white">
                    Mis Préstamos
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                    Inspecciona tus planes de cuotas, tasas asignadas y el avance de amortización quincenal.
                </p>
            </div>

            {prestamos.length > 0 ? (
                <div className="space-y-4">
                    {prestamos.map((p) => {
                        const estaAbierto = abiertoId === p.id
                        
                        // Estado del préstamo
                        let estadoTexto = p.estado
                        let badgeStyle = 'bg-slate-500/10 text-slate-400 border-slate-500/20'
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

                        // Calcular cuotas pagadas
                        const totalCuotas = p.cuotas?.length || p.numero_cuotas
                        const pagadas = p.cuotas?.filter(c => c.estado === 'pagada').length || 0

                        return (
                            <div 
                                key={p.id} 
                                className="bg-[#0A111F]/80 backdrop-blur-xl border border-white/[0.06] rounded-3xl overflow-hidden shadow-md transition-all duration-300"
                            >
                                {/* ACORDEÓN CABECERA */}
                                <button
                                    onClick={() => toggleAccordion(p.id)}
                                    className="w-full text-left p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none hover:bg-white/[0.01] transition-colors duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 bg-[#00D4FF]/5 border border-[#00D4FF]/10 rounded-2xl flex items-center justify-center text-[#00D4FF] shrink-0">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-black text-white">
                                                Crédito {p.codigo || 'N/A'}
                                            </span>
                                            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                                Libranza {p.tipo?.nombre || 'General'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Métricas rápidas de cabecera */}
                                    <div className="flex flex-wrap items-center gap-4 md:gap-8">
                                        <div>
                                            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                                Monto Aprobado
                                            </span>
                                            <span className="block text-sm font-black text-white mt-0.5">
                                                {formatCOP(p.monto_otorgado)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                                Amortización
                                            </span>
                                            <span className="block text-xs font-black text-slate-300 mt-0.5">
                                                {pagadas} / {totalCuotas} Cuotas
                                            </span>
                                        </div>
                                        <div>
                                            <span className={`inline-block text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${badgeStyle}`}>
                                                {estadoTexto}
                                            </span>
                                        </div>
                                        <div className="text-slate-400 hidden md:block">
                                            {estaAbierto ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </div>
                                    </div>
                                </button>

                                {/* ACORDEÓN CUERPO */}
                                {estaAbierto && (
                                    <div className="border-t border-white/[0.04] p-5 md:p-6 bg-[#040914]/50 space-y-6">
                                        
                                        {/* Ficha financiera del préstamo */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/[0.01] border border-white/[0.04] rounded-2xl p-4">
                                            <div>
                                                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Capital</span>
                                                <span className="block text-xs font-black text-slate-200 mt-0.5">{formatCOP(p.total_capital || p.monto_otorgado)}</span>
                                            </div>
                                            <div>
                                                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Intereses</span>
                                                <span className="block text-xs font-black text-slate-200 mt-0.5">{formatCOP(p.total_intereses)}</span>
                                            </div>
                                            <div>
                                                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Cargos y Seguros</span>
                                                <span className="block text-xs font-black text-slate-200 mt-0.5">{formatCOP(p.total_cargos)}</span>
                                            </div>
                                            <div>
                                                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Pagar</span>
                                                <span className="block text-xs font-black text-white mt-0.5">{formatCOP(p.total_a_pagar)}</span>
                                            </div>
                                        </div>

                                        {/* Plan de cuotas amortizadas */}
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#00D4FF] border-b border-[#00D4FF]/10 pb-2">
                                                Plan de Amortización Quincenal
                                            </h4>

                                            {p.cuotas && p.cuotas.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-xs">
                                                        <thead>
                                                            <tr className="text-slate-500 font-mono text-[9px] uppercase tracking-wider border-b border-white/[0.04]">
                                                                <th className="py-2.5 font-black">N° Cuota</th>
                                                                <th className="py-2.5 font-black">Fecha Descuento</th>
                                                                <th className="py-2.5 font-black">Capital</th>
                                                                <th className="py-2.5 font-black">Interés</th>
                                                                <th className="py-2.5 font-black">Seguros</th>
                                                                <th className="py-2.5 font-black">Total Cuota</th>
                                                                <th className="py-2.5 font-black text-center">Estado</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/[0.02] font-semibold text-slate-300">
                                                            {p.cuotas.map((c) => {
                                                                // Estilos de estado de cuota
                                                                let iconNode = <Clock className="w-3.5 h-3.5 text-slate-500" />
                                                                let textStyle = 'text-slate-400'
                                                                let rowBg = 'hover:bg-white/[0.005]'

                                                                if (c.estado === 'pagada') {
                                                                    iconNode = <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                                                    textStyle = 'text-emerald-500/90 font-bold'
                                                                    rowBg = 'bg-emerald-500/[0.01] hover:bg-emerald-500/[0.02]'
                                                                } else if (c.estado === 'mora') {
                                                                    iconNode = <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                                                                    textStyle = 'text-red-400 font-extrabold animate-pulse'
                                                                    rowBg = 'bg-red-500/[0.01] hover:bg-red-500/[0.02]'
                                                                }

                                                                return (
                                                                    <tr key={c.id} className={`transition-all duration-150 ${rowBg}`}>
                                                                        <td className="py-3 font-mono text-[10px] text-slate-500 font-bold">
                                                                            {c.numero_cuota}
                                                                        </td>
                                                                        <td className="py-3">
                                                                            {formatFecha(c.fecha_programada)}
                                                                        </td>
                                                                        <td className="py-3 font-mono">
                                                                            {formatCOP(c.capital_cuota)}
                                                                        </td>
                                                                        <td className="py-3 font-mono">
                                                                            {formatCOP(c.intereses_cuota)}
                                                                        </td>
                                                                        <td className="py-3 font-mono">
                                                                            {formatCOP(c.cargos_unicos)}
                                                                        </td>
                                                                        <td className="py-3 font-mono text-white font-black">
                                                                            {formatCOP(c.cuota_total)}
                                                                        </td>
                                                                        <td className="py-3">
                                                                            <div className="flex items-center justify-center gap-1.5">
                                                                                {iconNode}
                                                                                <span className={`text-[8px] font-black uppercase tracking-wider ${textStyle}`}>
                                                                                    {c.estado === 'pagada' ? 'Pagado' : c.estado === 'mora' ? 'En Mora' : 'Pendiente'}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-500 py-2">No se ha cargado el plan de amortización todavía.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="bg-[#0A111F]/80 border border-white/[0.06] rounded-3xl p-8 text-center space-y-4 shadow-lg">
                    <p className="text-slate-500 font-bold uppercase tracking-wider text-xs">No tienes créditos asociados</p>
                    <p className="text-xs text-slate-400 max-w-[340px] mx-auto leading-relaxed">
                        Si solicitaste un crédito y fue aprobado, aparecerá en esta pantalla una vez la administración registre el desembolso correspondiente.
                    </p>
                </div>
            )}
        </div>
    )
}
