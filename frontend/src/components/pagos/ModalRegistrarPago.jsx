import React, { useState } from 'react'
import { X, CheckCircle, Check, AlertTriangle } from 'lucide-react'
import api from '../../utils/api'
import { formatCOP, formatCOPCorto } from '../../utils/formatCOP'
import { QuickPrint } from '../ui/QuickPrint'
import { ComprobantePagoPDF } from './ComprobantePagoPDF'

function getSeveridad(dias) {
    if (dias > 30) return { label: 'CRÍTICO', color: '#F43F5E', bg: 'rgba(244,63,94,0.12)' }
    if (dias > 7) return { label: 'URGENTE', color: '#F97316', bg: 'rgba(249,115,22,0.08)' }
    return { label: 'AL DÍA / SEGUIMIENTO', color: '#10B981', bg: 'rgba(16,185,129,0.08)' }
}

export function ModalRegistrarPago({ cuota, onClose, onSuccess }) {
    const hoy = new Date().toISOString().split('T')[0]
    const montoTotal = parseFloat(cuota.cuota_total || 0).toFixed(0)
    const [formData, setFormData] = useState({
        cuota_id: cuota.id,
        fecha_pago: hoy,
        monto_recibido: montoTotal,
        metodo_pago: 'Efectivo',
        numero_comprobante: '',
        observacion: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [exito, setExito] = useState(false)
    const [confirmando, setConfirmando] = useState(false)
    const [pagoRegistrado, setPagoRegistrado] = useState(null)

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })
    const diasAtraso = cuota.dias_de_atraso || 0
    const sev = getSeveridad(diasAtraso)

    const ejecutarPago = async () => {
        setError('')
        setLoading(true)
        try {
            const res = await api.post('/pagos', {
                ...formData,
                monto_recibido: parseFloat(formData.monto_recibido)
            })
            setPagoRegistrado(res.data.pago)
            setExito(true)
            setConfirmando(false)
        } catch (err) {
            setError(err.response?.data?.error || 'Error al registrar el pago')
            setConfirmando(false)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(6,12,26,0.85)] backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-[var(--fondo-base)] border border-[var(--borde)] w-full max-w-md rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.5)] p-8 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-[var(--texto-3)] hover:text-[var(--texto-1)] transition-colors bg-[var(--fondo-card-alt)] p-2 rounded-full">
                    <X size={18} />
                </button>

                {/* PASO 1: FORMULARIO */}
                {!exito && !confirmando && (
                    <>
                        <h2 className="text-xl font-bold text-[var(--texto-1)] mb-2 flex items-center gap-2">
                            <CheckCircle className="text-[#10B981]" size={22} />
                            Registrar Pago
                        </h2>

                        <div className="mb-5 p-4 rounded-2xl" style={{ background: sev.bg, border: `1px solid ${sev.color}30` }}>
                             <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-[var(--texto-3)] uppercase tracking-wider">Cliente</p>
                                {diasAtraso > 0 && (
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full" style={{ background: sev.color, color: 'white' }}>
                                        {sev.label}
                                    </span>
                                )}
                            </div>
                            <p className="text-[var(--texto-1)] font-bold">{cuota.persona?.primer_nombre} {cuota.persona?.primer_apellido}</p>
                            <p className="text-xs text-[var(--texto-2)] mt-1">
                                Cuota N° {cuota.numero_cuota || '?'} · {diasAtraso} días atraso ·
                                <span className="font-bold ml-1" style={{ color: sev.color }}>{formatCOPCorto(cuota.cuota_total)}</span>
                            </p>
                        </div>

                        {error && <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>}

                        <form onSubmit={(e) => { e.preventDefault(); setConfirmando(true) }} className="space-y-4">
                            <div className="bg-[var(--fondo-card-alt)] p-6 rounded-3xl border border-[var(--borde)] shadow-inner">
                                <label className="block text-[#10B981] text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-center">Monto a Recibir ($)</label>
                                 <input
                                    type="number"
                                    name="monto_recibido"
                                    required
                                    autoFocus
                                    value={formData.monto_recibido}
                                    onChange={handleChange}
                                    className="w-full bg-transparent text-[var(--texto-1)] font-black text-4xl text-center focus:outline-none placeholder:text-[var(--texto-3)]/20"
                                    placeholder="0"
                                />
                                <p className="text-[10px] text-[var(--texto-3)] text-center mt-3 uppercase font-bold tracking-wider">
                                    Valor sugerido para cubrir cuota + mora
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                 <div>
                                    <label className="block text-[var(--texto-3)] text-[9px] font-bold uppercase mb-1.5 ml-1">Fecha</label>
                                    <input type="date" name="fecha_pago" required value={formData.fecha_pago} onChange={handleChange}
                                        className="w-full bg-[var(--fondo-input)] border border-[var(--borde)] rounded-xl px-3 py-2.5 text-xs text-[var(--texto-1)] focus:border-blue-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[var(--texto-3)] text-[9px] font-bold uppercase mb-1.5 ml-1">Método</label>
                                    <select name="metodo_pago" value={formData.metodo_pago} onChange={handleChange}
                                        className="w-full bg-[var(--fondo-input)] border border-[var(--borde)] rounded-xl px-3 py-2.5 text-xs text-[var(--texto-1)] focus:border-blue-500 focus:outline-none uppercase font-bold">
                                        <option className="text-black">Efectivo</option>
                                        <option className="text-black">Transferencia</option>
                                        <option className="text-black">Nequi</option>
                                        <option className="text-black">Daviplata</option>
                                        <option className="text-black">Deducción Nómina</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-2xl border border-white/5 hover:bg-white/5 text-slate-400 text-xs font-bold transition-all">Cancelar</button>
                                <button type="submit"
                                    className="flex-[2] bg-gradient-to-r from-[#1A6FFF] to-[#00D4FF] text-white font-black py-3.5 rounded-2xl transition-all shadow-[0_10px_30px_rgba(26,111,255,0.3)] uppercase tracking-widest text-xs">
                                    REVISAR Y CONFIRMAR →
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {/* PASO 2: CONFIRMACIÓN */}
                {confirmando && !exito && (
                    <div className="animate-fade-in">
                        <div className="flex items-center gap-2 mb-5">
                             <h2 className="text-xl font-bold text-[var(--texto-1)]">Confirmar Pago</h2>
                        </div>
                        <p className="text-[var(--texto-3)] text-sm mb-5">Revisa cuidadosamente antes de confirmar. Esta acción modifica la contabilidad.</p>                     <div className="bg-[var(--fondo-card-alt)] rounded-2xl p-5 border border-[var(--borde)] space-y-3 mb-5">
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--texto-3)]">Cliente</span>
                                <span className="text-[var(--texto-1)] font-bold">{cuota.persona?.primer_nombre} {cuota.persona?.primer_apellido}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--texto-3)]">Cuota N°</span>
                                <span className="text-[var(--texto-1)] font-bold">{cuota.numero_cuota}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--texto-3)]">Fecha de Pago</span>
                                <span className="text-[var(--texto-1)] font-bold">{formData.fecha_pago}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--texto-3)]">Método</span>
                                <span className="text-[var(--texto-1)] font-bold">{formData.metodo_pago}</span>
                            </div>
                            <div className="h-px bg-[var(--borde)] my-1" />
                            <div className="flex justify-between">
                                <span className="text-[var(--texto-2)] font-bold uppercase text-xs tracking-wider">MONTO A COBRAR</span>
                                <span className="text-[#10B981] font-black text-xl">{formatCOP(parseFloat(formData.monto_recibido))}</span>
                            </div>
                        </div>

                        {error && <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>}

                        <div className="flex gap-3">
                            <button type="button" onClick={() => setConfirmando(false)} className="flex-1 py-3.5 rounded-2xl border border-white/5 hover:bg-white/5 text-slate-400 text-xs font-bold transition-all">← Volver</button>
                            <button
                                onClick={ejecutarPago}
                                disabled={loading}
                                className="flex-[2] bg-gradient-to-r from-[#10B981] to-[#059669] disabled:opacity-50 text-white font-black py-3.5 rounded-2xl transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)] uppercase tracking-widest text-xs"
                            >
                                {loading ? 'Procesando...' : '✓ CONFIRMAR PAGO'}
                            </button>
                        </div>
                    </div>
                )}

                {/* PASO 3: ÉXITO + COMPROBANTE */}
                {exito && (
                    <div className="text-center py-6 animate-scale-in">
                        <div className="w-20 h-20 bg-[#10B981]/15 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#10B981]/30">
                            <Check className="text-[#10B981]" size={40} />
                        </div>
                         <h2 className="text-2xl font-black text-[var(--texto-1)] mb-2 uppercase tracking-tighter">¡Pago Exitoso!</h2>
                        <p className="text-[var(--texto-3)] text-sm mb-8 px-4">El ingreso ha sido registrado en la contabilidad y la cuota ha sido actualizada.</p>

                        <div className="space-y-4">
                            <QuickPrint
                                autoPrint={true}
                                component={ComprobantePagoPDF}
                                className="!py-4 !bg-gradient-to-r !from-[#10B981] !to-[#059669] !text-sm !shadow-[0_15px_30px_rgba(16,185,129,0.4)]"
                                props={{
                                    pago: pagoRegistrado || { ...formData, numero_comprobante: 'CP-TEMP' },
                                    cuota: cuota,
                                    persona: cuota.persona,
                                    empresa: cuota.persona?.empresa
                                }}
                            />

                            <button
                                type="button"
                                onClick={() => {
                                    onSuccess()
                                    onClose()
                                }}
                                className="w-full py-3 rounded-xl text-slate-500 font-bold hover:text-white hover:bg-white/5 transition-all text-sm flex items-center justify-center gap-2"
                            >
                                <X size={16} />
                                Cerrar sin imprimir
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
