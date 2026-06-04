import React, { useState, useEffect } from 'react';
import { X, Upload, Save, AlertCircle, CheckCircle2, Loader2, Copy } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { formatCOP } from '../../utils/formatCOP';

export function ModalRecaudoMasivo({ onClose, onRefresh }) {
    const [empresas, setEmpresas] = useState([]);
    const [empresaId, setEmpresaId] = useState('');
    const [textoPlano, setTextoPlano] = useState('');
    const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0]);

    const [procesando, setProcesando] = useState(false);
    const [resultados, setResultados] = useState(null);

    useEffect(() => {
        api.get('/empresas').then(res => setEmpresas(res.data?.empresas || [])).catch(console.error);
    }, []);

    const procesarDatos = async () => {
        if (!empresaId) return toast.error("Seleccione una empresa");
        if (!textoPlano.trim()) return toast.error("Ingrese los datos de pago");

        setProcesando(true);
        try {
            // Parsear texto de forma inteligente:
            // - Cédula, Nombre, Monto
            // - Cédula, Monto
            // - Nombre, Monto
            const lineasRaw = textoPlano.split('\n').filter(l => l.trim());
            const lineas = lineasRaw.map(l => {
                const parts = l.split(/[,;\t]/).map(p => p.trim());
                if (parts.length >= 3) {
                    return {
                        cedula: parts[0].replace(/[^0-9]/g, ''),
                        nombre: parts[1],
                        monto: parseFloat(parts[2].replace(/[^0-9]/g, '')) || 0
                    };
                } else if (parts.length === 2) {
                    const firstPartClean = parts[0].replace(/[^0-9]/g, '');
                    const isCedula = firstPartClean.length >= 5 && /^\d+$/.test(firstPartClean);
                    if (isCedula) {
                        return {
                            cedula: firstPartClean,
                            monto: parseFloat(parts[1].replace(/[^0-9]/g, '')) || 0
                        };
                    } else {
                        return {
                            nombre: parts[0],
                            monto: parseFloat(parts[1].replace(/[^0-9]/g, '')) || 0
                        };
                    }
                }
                return null;
            }).filter(l => l && (l.cedula || l.nombre) && l.monto > 0);

            const res = await api.post('/pagos/masivo', {
                empresa_id: empresaId,
                fecha_pago: fechaPago,
                metodo_pago: 'Recaudo Masivo Nómina',
                lineas
            });

            setResultados(res.data);
            toast.success("Proceso masivo completado");
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error(error);
            toast.error("Error crítico en el proceso masivo");
        } finally {
            setProcesando(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[rgba(6,12,26,0.9)] backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
            <div className="bg-[var(--fondo-base)] border border-[var(--borde)] w-full max-w-4xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] my-auto overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-[var(--borde)] bg-[var(--fondo-card-alt)] relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-[var(--texto-3)] hover:text-[var(--texto-1)] transition-colors bg-[var(--fondo-base)] p-2 rounded-full">
                        <X size={18} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#00D4FF] flex items-center justify-center text-white shadow-lg">
                            <Upload size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--texto-1)] uppercase tracking-tight">Recaudo Masivo por Nómina</h2>
                            <p className="text-[10px] text-[var(--texto-3)] font-black uppercase tracking-widest mt-0.5">Carga masiva basada en listado de deducciones</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                    {!resultados ? (
                        <div className="grid grid-cols-1 gap-8">
                            <div className="space-y-6">
                                <div className="p-4 bg-[var(--fondo-card-alt)] border border-[var(--borde)] rounded-2xl">
                                    <h3 className="text-[var(--texto-1)] font-bold text-xs uppercase mb-3 flex items-center gap-2">
                                        <AlertCircle size={14} /> Configuración del Lote
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[var(--texto-2)] text-[10px] uppercase font-black mb-2 px-1">Empresa Pagadora</label>
                                            <select
                                                value={empresaId}
                                                onChange={e => setEmpresaId(e.target.value)}
                                                className="w-full bg-[var(--fondo-base)] border border-[var(--borde)] rounded-xl px-4 py-3 text-[var(--texto-1)] focus:border-[#1A6FFF] outline-none transition-all"
                                            >
                                                <option value="" className="text-black">Seleccione empresa...</option>
                                                {empresas.map(e => <option key={e.id} value={e.id} className="text-black">{e.nombre}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[var(--texto-2)] text-[10px] uppercase font-black mb-2 px-1">Fecha de Recaudo</label>
                                            <input
                                                type="date"
                                                value={fechaPago}
                                                onChange={e => setFechaPago(e.target.value)}
                                                className="w-full bg-[var(--fondo-base)] border border-[var(--borde)] rounded-xl px-4 py-3 text-[var(--texto-1)] focus:border-[#1A6FFF] outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <label className="block text-[var(--texto-2)] text-[10px] uppercase font-black mb-2 px-1">Pegar listado (Nombre, Monto)</label>
                                <textarea
                                    className="min-h-[200px] w-full bg-[var(--fondo-base)] border border-[var(--borde)] rounded-2xl p-4 text-sm font-mono text-[#10B981] focus:border-[#10B981]/50 outline-none transition-all"
                                    placeholder="JULIO ALBERTO PEREZ, 125000&#10;MARIA ELENA GOMEZ, 95000"
                                    value={textoPlano}
                                    onChange={e => setTextoPlano(e.target.value)}
                                />
                                <button
                                    onClick={procesarDatos}
                                    disabled={procesando || !empresaId || !textoPlano.trim()}
                                    className="mt-4 w-full bg-[#1A6FFF] hover:bg-[#155bd5] text-white font-black py-4 rounded-xl shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {procesando ? (
                                        <><Loader2 size={20} className="animate-spin" /> PROCESANDO...</>
                                    ) : (
                                        <><Save size={20} /> APLICAR RECAUDO MASIVO</>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-[var(--fondo-card-alt)] p-4 rounded-2xl border border-[var(--borde)] text-center">
                                    <p className="text-[10px] text-[var(--texto-3)] uppercase font-black">Procesados</p>
                                    <p className="text-2xl font-black text-[var(--texto-1)]">{resultados.resumen.total}</p>
                                </div>
                                <div className="bg-green-500/10 p-4 rounded-2xl border border-green-500/20 text-center">
                                    <p className="text-[10px] text-green-400 uppercase font-black">Exitosos</p>
                                    <p className="text-2xl font-black text-green-400">{resultados.resumen.exitosos}</p>
                                </div>
                                <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 text-center">
                                    <p className="text-[10px] text-red-400 uppercase font-black">Fallidos</p>
                                    <p className="text-2xl font-black text-red-400">{resultados.resumen.fallidos}</p>
                                </div>
                            </div>

                            <div className="bg-[var(--fondo-base)] border border-[var(--borde)] rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="sticky top-0 bg-[var(--fondo-card-alt)] text-[var(--texto-3)] uppercase text-[9px]">
                                        <tr>
                                            <th className="p-3">Estado</th>
                                            <th className="p-3">Registro Original</th>
                                            <th className="p-3">Resultado / Error</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--borde)] font-medium">
                                        {resultados.detalles.map((det, idx) => (
                                            <tr key={idx} className={det.success ? '' : 'bg-red-500/5'}>
                                                <td className="p-3">
                                                    {det.success ? <CheckCircle2 className="text-green-500" size={16} /> : <AlertCircle className="text-red-500" size={16} />}
                                                </td>
                                                <td className="p-3 text-[var(--texto-3)]">{det.raw || det.persona}</td>
                                                <td className="p-3">
                                                    {det.success ? (
                                                        <span className="text-green-500">Pago aplicado: {formatCOP(det.monto)}</span>
                                                    ) : (
                                                        <span className="text-red-500 font-bold">{det.error}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <button
                                onClick={() => setResultados(null)}
                                className="w-full py-4 bg-[var(--fondo-card-alt)] border border-[var(--borde)] rounded-xl text-[var(--texto-1)] font-bold uppercase text-xs hover:bg-[var(--fondo-base)] transition-all"
                            >
                                Iniciar nuevo proceso
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer simple */}
                <div className="p-4 bg-[var(--fondo-card)] border-t border-[var(--borde)] text-center">
                    <p className="text-[9px] text-[var(--texto-3)] font-bold uppercase tracking-widest opacity-50">YAP Advanced Financial Engine v2.0 - Modo Bulk</p>
                </div>
            </div>
        </div>
    );
}
