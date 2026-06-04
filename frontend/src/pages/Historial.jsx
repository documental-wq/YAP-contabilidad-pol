import React, { useState, useEffect } from 'react'
import { CheckCircle2, Clock } from 'lucide-react'
import api from '../utils/api'
import { formatCOP, formatCOPCorto } from '../utils/formatCOP'
import { formatFechaCorta, formatFechaLarga } from '../utils/formatFecha'
import { QuickPrint } from '../components/ui/QuickPrint'
import { GenericReportPDF } from '../components/ui/GenericReportPDF'

export function Historial() {
    const [pagos, setPagos] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/pagos').then(res => setPagos(res.data?.pagos || [])).catch(() => setPagos([])).finally(() => setLoading(false))
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
                        <Clock className="text-[var(--cyan)]" />
                        Historial de Recaudos
                    </h1>
                    <p className="text-[var(--texto-3)] text-sm mt-1">Registro de todos los pagos ingresados al sistema.</p>
                </div>
                <QuickPrint
                    component={GenericReportPDF}
                    props={{
                        title: "Reporte Histórico de Recaudos",
                        subtitle: "Consolidado detallado de pagos YAP",
                        infoRows: [
                            { label: "Total Pagos Registrados", value: pagos.length },
                            { label: "Monto Total Recaudado", value: formatCOP(pagos.reduce((s, p) => s + p.monto_pagado, 0)) }
                        ],
                        tableHeaders: [
                            { label: "Fecha" },
                            { label: "Cliente" },
                            { label: "Monto", align: "text-right" },
                            { label: "Método", align: "text-center" },
                            { label: "Comprobante" }
                        ],
                        tableRows: pagos.map(p => [
                            { value: formatFechaCorta(p.fecha_pago) },
                            { value: `${p.persona?.primer_nombre || ''} ${p.persona?.primer_apellido || ''}`.trim() || '—' },
                            { value: formatCOP(p.monto_pagado) },
                            { value: p.metodo_pago },
                            { value: p.numero_comprobante || '-' }
                        ]),
                        footerText: "TOTAL RECAUDO BRUTO: " + formatCOP(pagos.reduce((s, p) => s + p.monto_pagado, 0))
                    }}
                />
            </div>

            <div className="bg-[var(--fondo-card)] border border-[var(--borde)] rounded-2xl p-6 shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--borde)]">
                                <th className="py-3 px-4 text-xs font-semibold text-[var(--texto-3)] uppercase tracking-wider">Fecha / Comprobante</th>
                                <th className="py-3 px-4 text-xs font-semibold text-[var(--texto-3)] uppercase tracking-wider">Cliente</th>
                                <th className="py-3 px-4 text-xs font-semibold text-[var(--texto-3)] uppercase tracking-wider text-right">Monto Recibido</th>
                                <th className="py-3 px-4 text-xs font-semibold text-[var(--texto-3)] uppercase tracking-wider text-right">Int. Mora Cobrado</th>
                                <th className="py-3 px-4 text-xs font-semibold text-[var(--cyan)] uppercase tracking-wider text-center">Medio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="py-8 text-center text-[var(--texto-3)]">Cargando recaudos...</td></tr>
                            ) : pagos.length === 0 ? (
                                <tr><td colSpan="5" className="py-8 text-center text-[var(--texto-3)]">No hay recaudos registrados.</td></tr>
                            ) : (
                                pagos.map(p => (
                                    <tr key={p.id} className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(79,209,197,0.05)] transition-colors">
                                        <td className="py-3 px-4">
                                            <p className="text-sm text-[var(--texto-1)]">{formatFechaLarga(p.fecha_pago)}</p>
                                            <p className="text-xs text-[var(--texto-3)] font-mono">Ref: {p.numero_comprobante || p.id.slice(0, 8)}</p>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-white font-medium">{p.persona?.primer_nombre} {p.persona?.primer_apellido}</td>
                                        <td className="py-3 px-4 text-sm text-[var(--cyan)] text-right font-bold font-mono">{formatCOP(p.monto_pagado)}</td>
                                        <td className="py-3 px-4 text-sm text-[#F43F5E] text-right font-mono">{p.interes_mora_cobrado > 0 ? formatCOPCorto(p.interes_mora_cobrado) : '-'}</td>
                                        <td className="py-3 px-4 text-xs text-[var(--texto-2)] text-center uppercase tracking-wider">
                                            {p.metodo_pago}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
