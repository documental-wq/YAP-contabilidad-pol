import React, { useState, useEffect } from 'react'
import { AlertTriangle, Clock, X, CheckCircle, Phone, Flame } from 'lucide-react'
import api from '../utils/api'
import { formatCOP, formatCOPCorto } from '../utils/formatCOP'
import { formatFechaCorta } from '../utils/formatFecha'
import { QuickPrint } from '../components/ui/QuickPrint'
import { GenericReportPDF } from '../components/ui/GenericReportPDF'
import { ModalRegistrarPago } from '../components/pagos/ModalRegistrarPago'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getSeveridad(dias) {
    if (dias > 30) return { label: 'CRÍTICO', color: '#F43F5E', bg: 'rgba(244,63,94,0.12)', border: '#F43F5E', rowClass: 'mora-high', icon: Flame }
    if (dias > 7) return { label: 'URGENTE', color: '#F97316', bg: 'rgba(249,115,22,0.08)', border: '#F97316', rowClass: 'mora-mid', icon: AlertTriangle }
    return { label: 'SEGUIMIENTO', color: '#FBBF24', bg: 'rgba(251,191,36,0.06)', border: '#FBBF24', rowClass: 'mora-low', icon: Clock }
}

function BadgeSeveridad({ dias }) {
    const s = getSeveridad(dias)
    const Icon = s.icon
    return (
        <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
            style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}33` }}
        >
            <Icon size={9} />
            {s.label}
        </span>
    )
}

export function Mora() {
    const [vencidas, setVencidas] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalPago, setModalPago] = useState(null)

    const cargar = async () => {
        setLoading(true)
        try {
            const res = await api.get('/cuotas/vencidas')
            setVencidas(res.data?.cuotas || [])
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    useEffect(() => { cargar() }, [])

    // ── KPI aggregates ──
    const totalMora = vencidas.reduce((s, c) => s + (c.cuota_total || 0), 0)
    const criticas = vencidas.filter(c => c.dias_de_atraso > 30)
    const diasPromedio = vencidas.length
        ? Math.round(vencidas.reduce((s, c) => s + c.dias_de_atraso, 0) / vencidas.length)
        : 0

    return (
        <>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
                            <span className="p-2 bg-[#F43F5E]/15 rounded-xl border border-[#F43F5E]/20">
                                <AlertTriangle className="text-[#F43F5E]" size={20} />
                            </span>
                            Control de Mora y Vencimientos
                        </h1>
                        <p className="text-[var(--texto-3)] text-sm mt-1 ml-1">Cuotas atrasadas con análisis de severidad en tiempo real.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <QuickPrint
                            component={GenericReportPDF}
                            props={{
                                title: "Reporte de Cartera Vencida (Mora)",
                                subtitle: "Seguimiento de cuotas pendientes",
                                infoRows: [
                                    { label: "Total Cuotas Vencidas", value: vencidas.length },
                                    { label: "Monto Total en Mora", value: formatCOP(totalMora) }
                                ],
                                tableHeaders: [
                                    { label: "Cliente" },
                                    { label: "Cuota" },
                                    { label: "Vencimiento", align: "text-center" },
                                    { label: "Días Atraso", align: "text-right" },
                                    { label: "Valor", align: "text-right" }
                                ],
                                tableRows: vencidas.map(c => [
                                    { value: `${c.persona?.primer_nombre || ''} ${c.persona?.primer_apellido || ''}` },
                                    { value: `N° ${c.numero_cuota}` },
                                    { value: formatFechaCorta(c.fecha_programada) },
                                    { value: c.dias_de_atraso, style: "text-red-600 font-bold" },
                                    { value: formatCOP(c.cuota_total) }
                                ]),
                                footerText: "NOTIFICAR DE INMEDIATO A LOS DEUDORES PARA EVITAR ACCIONES LEGALES."
                            }}
                        />
                        {vencidas.length > 0 && (
                            <div className="bg-[rgba(244,63,94,0.1)] border border-[#F43F5E]/30 text-[#F43F5E] font-bold px-4 py-2 rounded-xl flex items-center gap-2 animate-pulse-glow">
                                <Flame size={14} />
                                {vencidas.length} en Mora
                            </div>
                        )}
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[var(--fondo-card)] border border-[var(--borde)] rounded-2xl p-5 relative overflow-hidden group hover:border-[#F43F5E]/30 transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#F43F5E]/5 rounded-full -translate-y-6 translate-x-6 group-hover:scale-150 transition-transform duration-500" />
                        <p className="text-[var(--texto-3)] text-[10px] font-black uppercase tracking-widest mb-2">Total en Mora</p>
                        <p className="text-2xl font-black text-[#F43F5E] number-font">{formatCOPCorto(totalMora)}</p>
                        <p className="text-xs text-[var(--texto-3)] mt-1">{vencidas.length} cuota{vencidas.length !== 1 ? 's' : ''} pendiente{vencidas.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="bg-[var(--fondo-card)] border border-[var(--borde)] rounded-2xl p-5 relative overflow-hidden group hover:border-[#F97316]/30 transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#F97316]/5 rounded-full -translate-y-6 translate-x-6 group-hover:scale-150 transition-transform duration-500" />
                        <p className="text-[var(--texto-3)] text-[10px] font-black uppercase tracking-widest mb-2">Casos Críticos</p>
                        <p className="text-2xl font-black text-[#F97316] number-font">{criticas.length}</p>
                        <p className="text-xs text-[var(--texto-3)] mt-1">Más de 30 días de atraso</p>
                    </div>
                    <div className="bg-[var(--fondo-card)] border border-[var(--borde)] rounded-2xl p-5 relative overflow-hidden group hover:border-[#FBBF24]/30 transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#FBBF24]/5 rounded-full -translate-y-6 translate-x-6 group-hover:scale-150 transition-transform duration-500" />
                        <p className="text-[var(--texto-3)] text-[10px] font-black uppercase tracking-widest mb-2">Atraso Promedio</p>
                        <p className="text-2xl font-black text-[#FBBF24] number-font">{diasPromedio}</p>
                        <p className="text-xs text-[var(--texto-3)] mt-1">días de atraso promedio</p>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-[var(--fondo-card)] border border-[var(--borde)] rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--borde)] bg-[rgba(255,255,255,0.02)]">
                                    <th className="py-3 px-4 text-xs font-semibold text-[var(--texto-3)] uppercase tracking-wider">Cliente</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-[var(--texto-3)] uppercase tracking-wider">Préstamo</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-[var(--texto-3)] uppercase tracking-wider">Cuota</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-[var(--texto-3)] uppercase tracking-wider">Severidad</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-[var(--texto-3)] uppercase tracking-wider">Vencimiento</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-[var(--texto-3)] uppercase tracking-wider text-right">Días Atraso</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-[var(--texto-3)] uppercase tracking-wider text-right">Valor Cuota</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-[#F43F5E] uppercase tracking-wider">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="8" className="py-12 text-center text-[var(--texto-3)]">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-[#4FD1C5]/30 border-t-[#4FD1C5] rounded-full animate-spin" />
                                            Cargando mora...
                                        </div>
                                    </td></tr>
                                ) : vencidas.length === 0 ? (
                                    <tr><td colSpan="8" className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                                                <CheckCircle size={32} className="text-[#10B981]" />
                                            </div>
                                            <p className="text-[#10B981] font-bold text-sm">¡Excelente! No hay cuotas en mora.</p>
                                            <p className="text-[var(--texto-3)] text-xs">El portafolio está al día.</p>
                                        </div>
                                    </td></tr>
                                ) : (
                                    vencidas.map(c => {
                                        const sev = getSeveridad(c.dias_de_atraso)
                                        return (
                                            <tr
                                                key={c.id}
                                                className={`border-b border-[rgba(255,255,255,0.04)] transition-all hover:brightness-110 ${sev.rowClass}`}
                                            >
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0"
                                                            style={{ background: `${sev.color}18`, color: sev.color, border: `1px solid ${sev.color}30` }}
                                                        >
                                                            {c.persona?.primer_nombre?.[0]}{c.persona?.primer_apellido?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-white font-semibold leading-none">{c.persona?.primer_nombre} {c.persona?.primer_apellido}</p>
                                                            <p className="text-[10px] text-[var(--texto-3)] mt-0.5">Tel: {c.persona?.telefono || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-sm text-[var(--cyan)] font-mono">#{c.prestamo_id?.slice(0, 8)}</td>
                                                <td className="py-3.5 px-4 text-sm text-white">N° {c.numero_cuota}</td>
                                                <td className="py-3.5 px-4"><BadgeSeveridad dias={c.dias_de_atraso} /></td>
                                                <td className="py-3.5 px-4 text-sm text-[var(--texto-2)]">{formatFechaCorta(c.fecha_programada)}</td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <span className="text-sm font-black" style={{ color: sev.color }}>{c.dias_de_atraso} días</span>
                                                </td>
                                                <td className="py-3.5 px-4 text-sm text-white text-right font-mono font-bold">{formatCOPCorto(c.cuota_total)}</td>
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => setModalPago(c)}
                                                            className="text-[10px] border border-[#F43F5E]/40 text-[#F43F5E] hover:bg-[#F43F5E]/10 px-3 py-1.5 rounded-lg transition-all font-bold whitespace-nowrap"
                                                        >
                                                            Reg. Pago
                                                        </button>
                                                        {c.persona?.telefono && (
                                                            <a
                                                                href={`https://wa.me/57${c.persona.telefono.replace(/\D/g, '')}?text=Hola%20${c.persona.primer_nombre},%20le%20recordamos%20que%20tiene%20una%20cuota%20vencida%20por%20${formatCOPCorto(c.cuota_total)}.%20Por%20favor%20comuníquese%20con%20nosotros.`}
                                                                target="_blank" rel="noreferrer"
                                                                title="Contactar por WhatsApp"
                                                                className="p-1.5 text-[#25D366] hover:bg-[#25D366]/10 rounded-lg transition-colors"
                                                            >
                                                                <Phone size={14} />
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {modalPago && (
                <ModalRegistrarPago
                    cuota={modalPago}
                    onClose={() => setModalPago(null)}
                    onSuccess={() => { setModalPago(null); cargar(); }}
                />
            )}
        </>
    )
}
