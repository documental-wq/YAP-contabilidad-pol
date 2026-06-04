import React, { useState, useEffect } from 'react'
import apiCliente from '../utils/apiCliente'
import toast from 'react-hot-toast'
import { 
    History, 
    Calendar, 
    DollarSign, 
    Check, 
    Award, 
    CreditCard, 
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
        month: 'long',
        year: 'numeric'
    }).format(fecha)
}

export function PortalPagos() {
    const [pagos, setPagos] = useState([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        const cargarPagos = async () => {
            try {
                const { data } = await apiCliente.get('/pagos')
                setPagos(data.pagos || [])
            } catch (error) {
                console.error(error)
                toast.error('Error al cargar tu historial de pagos.')
            } finally {
                setCargando(false)
            }
        }
        cargarPagos()
    }, [])

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 text-[#00D4FF] animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Recuperando recibos...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-wide text-white">
                    Historial de Pagos
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                    Consulta el registro cronológico de cada abono, recaudo y descuento de nómina aplicado a tus créditos.
                </p>
            </div>

            {pagos.length > 0 ? (
                <div className="relative border-l border-white/[0.06] pl-6 ml-4 space-y-8 py-2">
                    {pagos.map((p, index) => {
                        return (
                            <div key={p.id} className="relative group">
                                {/* Círculo indicador de la línea de tiempo */}
                                <span className="absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full bg-[#050B14] border-2 border-[#10B981] flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.4)] group-hover:scale-110 transition-transform duration-300">
                                    <Check className="w-2.5 h-2.5 text-[#10B981]" strokeWidth={4} />
                                </span>

                                {/* Card de detalles del pago */}
                                <div className="bg-[#0A111F]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#10B981]/30 transition-colors duration-300">
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {/* Quincena */}
                                            <span className="bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                                                Quincena: {p.quincena}
                                            </span>
                                            
                                            {/* Canal de Pago */}
                                            <span className="bg-white/[0.02] border border-white/[0.04] text-slate-400 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                                <CreditCard className="w-2.5 h-2.5" />
                                                {p.metodo_pago}
                                            </span>
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-black tracking-tight text-white">
                                                {formatCOP(p.monto_pagado)}
                                            </h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                                Abonado al Crédito <span className="text-[#00D4FF] font-mono">{p.prestamo?.codigo || 'N/A'}</span> ({p.prestamo?.tipo?.nombre}) · Cuota N° {p.numero_cuota}
                                            </p>
                                        </div>

                                        {p.observacion && (
                                            <div className="text-xs text-slate-500 font-medium italic border-l border-white/10 pl-3">
                                                "{p.observacion}"
                                            </div>
                                        )}
                                    </div>

                                    {/* Información de recibo */}
                                    <div className="md:text-right shrink-0 border-t border-white/[0.04] md:border-t-0 pt-3 md:pt-0 flex flex-row md:flex-col justify-between items-center md:items-end gap-2">
                                        <div>
                                            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                                Comprobante N°
                                            </span>
                                            <span className="block text-xs font-mono font-bold text-slate-300 mt-0.5">
                                                {p.numero_comprobante || 'S/N'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest md:mt-2">
                                                Fecha de Registro
                                            </span>
                                            <span className="block text-xs font-bold text-slate-400 mt-0.5">
                                                {formatFecha(p.fecha_pago)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="bg-[#0A111F]/80 border border-white/[0.06] rounded-3xl p-8 text-center space-y-4 shadow-lg">
                    <History className="w-12 h-12 text-slate-600 mx-auto" />
                    <div>
                        <p className="text-slate-500 font-bold uppercase tracking-wider text-xs">Sin pagos registrados</p>
                        <p className="text-xs text-slate-400 max-w-[340px] mx-auto leading-relaxed mt-1.5">
                            Cuando tu empresa o tú realicen un pago, y este sea verificado y registrado por el administrador, aparecerá en esta línea de tiempo de inmediato.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
