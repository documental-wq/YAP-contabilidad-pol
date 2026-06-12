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

    const [tabActivo, setTabActivo] = useState('visual'); // 'visual' | 'excel'
    const [empleados, setEmpleados] = useState([]);
    const [cargandoEmpleados, setCargandoEmpleados] = useState(false);
    const [seleccionados, setSeleccionados] = useState({}); // { [personaId]: boolean }
    const [montosPago, setMontosPago] = useState({}); // { [personaId]: number }

    useEffect(() => {
        api.get('/empresas').then(res => setEmpresas(res.data?.empresas || [])).catch(console.error);
    }, []);

    useEffect(() => {
        if (!empresaId) {
            setEmpleados([]);
            setSeleccionados({});
            setMontosPago({});
            return;
        }

        setCargandoEmpleados(true);
        api.get(`/personas?empresa_id=${empresaId}`)
            .then(res => {
                const personas = res.data?.personas || [];
                // Filtrar solo los que tienen préstamos activos o en mora
                const conPrestamo = personas.filter(p => p.prestamos && p.prestamos.length > 0);
                setEmpleados(conPrestamo);

                // Inicializar todos seleccionados y con el monto de la cuota actual
                const initialSeleccionados = {};
                const initialMontos = {};
                conPrestamo.forEach(p => {
                    initialSeleccionados[p.id] = true;
                    // Primera cuota pendiente
                    const primeraCuota = p.prestamos[0].cuotas?.[0];
                    initialMontos[p.id] = primeraCuota ? primeraCuota.cuota_total : 0;
                });
                setSeleccionados(initialSeleccionados);
                setMontosPago(initialMontos);
            })
            .catch(err => {
                console.error("Error al cargar empleados:", err);
                toast.error("No se pudieron cargar los empleados de la empresa");
            })
            .finally(() => {
                setCargandoEmpleados(false);
            });
    }, [empresaId]);

    const todosSeleccionados = empleados.length > 0 && empleados.every(e => seleccionados[e.id]);
    const algunosSeleccionados = empleados.length > 0 && empleados.some(e => seleccionados[e.id]) && !todosSeleccionados;

    const handleSelectAll = (checked) => {
        const nextSel = {};
        empleados.forEach(e => {
            nextSel[e.id] = checked;
        });
        setSeleccionados(nextSel);
    };

    const handleSelectOne = (id, checked) => {
        setSeleccionados(prev => ({
            ...prev,
            [id]: checked
        }));
    };

    const handleMontoChange = (id, val) => {
        setMontosPago(prev => ({
            ...prev,
            [id]: parseFloat(val) || 0
        }));
    };

    const totalRecaudado = empleados.reduce((sum, e) => {
        if (seleccionados[e.id]) {
            return sum + (montosPago[e.id] || 0);
        }
        return sum;
    }, 0);

    const cantidadSeleccionados = empleados.filter(e => seleccionados[e.id]).length;

    const procesarDatos = async () => {
        if (!empresaId) return toast.error("Seleccione una empresa");

        let lineas = [];

        if (tabActivo === 'visual') {
            const seleccionadosList = empleados.filter(e => seleccionados[e.id]);
            if (seleccionadosList.length === 0) {
                return toast.error("Debe seleccionar al menos un empleado para registrar pagos");
            }
            lineas = seleccionadosList.map(e => ({
                cedula: e.cedula,
                monto: montosPago[e.id] || 0
            })).filter(item => item.monto > 0);

            if (lineas.length === 0) {
                return toast.error("El monto a pagar debe ser mayor a 0 para los empleados seleccionados");
            }
        } else {
            if (!textoPlano.trim()) return toast.error("Ingrese los datos de pago");
            const lineasRaw = textoPlano.split('\n').filter(l => l.trim());
            lineas = lineasRaw.map(l => {
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
        }

        if (lineas.length === 0) {
            return toast.error("No hay líneas válidas para procesar");
        }

        setProcesando(true);
        try {
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

                {/* Tabs Selector */}
                {!resultados && (
                    <div className="flex border-b border-[var(--borde)] bg-[var(--fondo-card-alt)]">
                        <button
                            type="button"
                            onClick={() => setTabActivo('visual')}
                            className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                                tabActivo === 'visual'
                                    ? 'text-[#00D4FF] border-[#00D4FF] bg-white/5'
                                    : 'text-[var(--texto-3)] border-transparent hover:text-[var(--texto-1)] hover:bg-white/2'
                            }`}
                        >
                            Lista de Empleados (Visual)
                        </button>
                        <button
                            type="button"
                            onClick={() => setTabActivo('excel')}
                            className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                                tabActivo === 'excel'
                                    ? 'text-[#00D4FF] border-[#00D4FF] bg-white/5'
                                    : 'text-[var(--texto-3)] border-transparent hover:text-[var(--texto-1)] hover:bg-white/2'
                            }`}
                        >
                            Copiar desde Excel
                        </button>
                    </div>
                )}

                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                    {!resultados ? (
                        <div className="space-y-6">
                            {/* Configuration Row */}
                            <div className="p-4 bg-[var(--fondo-card-alt)] border border-[var(--borde)] rounded-2xl">
                                <h3 className="text-[var(--texto-1)] font-bold text-xs uppercase mb-3 flex items-center gap-2">
                                    <AlertCircle size={14} /> Configuración del Lote
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            {/* Tab Content */}
                            {tabActivo === 'visual' ? (
                                <div className="space-y-4">
                                    <h3 className="text-[var(--texto-2)] text-[10px] uppercase font-black px-1">Seleccionar Empleados y Montos</h3>
                                    
                                    {!empresaId ? (
                                        <div className="p-12 text-center border border-dashed border-[var(--borde)] rounded-2xl bg-white/2">
                                            <p className="text-sm text-[var(--texto-3)]">Selecciona una empresa pagadora arriba para listar sus empleados con créditos activos.</p>
                                        </div>
                                    ) : cargandoEmpleados ? (
                                        <div className="p-12 text-center">
                                            <Loader2 size={32} className="animate-spin text-[#00D4FF] mx-auto mb-2" />
                                            <p className="text-xs text-[var(--texto-3)] uppercase font-black tracking-wider">Cargando empleados...</p>
                                        </div>
                                    ) : empleados.length === 0 ? (
                                        <div className="p-12 text-center border border-dashed border-[var(--borde)] rounded-2xl bg-white/2">
                                            <p className="text-sm text-[var(--texto-3)]">No se encontraron empleados con créditos activos o pendientes en esta empresa.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Scrollable Table Container */}
                                            <div className="border border-[var(--borde)] bg-[var(--fondo-card)] rounded-2xl overflow-hidden max-h-[350px] overflow-y-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="sticky top-0 bg-[var(--fondo-card-alt)] text-[var(--texto-3)] uppercase text-[9px] border-b border-[var(--borde)] z-10 font-bold">
                                                        <tr>
                                                            <th className="p-3 w-12 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={todosSeleccionados}
                                                                    ref={el => {
                                                                        if (el) el.indeterminate = algunosSeleccionados;
                                                                    }}
                                                                    onChange={e => handleSelectAll(e.target.checked)}
                                                                    className="accent-[#00D4FF] w-4 h-4 cursor-pointer"
                                                                />
                                                            </th>
                                                            <th className="p-3">Cliente</th>
                                                            <th className="p-3">Préstamo / Cuota Activa</th>
                                                            <th className="p-3 text-right">Cuota Programada</th>
                                                            <th className="p-3 text-right w-40">Monto a Abonar</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[var(--borde)] font-medium">
                                                        {empleados.map(e => {
                                                            const pActivo = e.prestamos[0];
                                                            const cPendiente = pActivo.cuotas[0];
                                                            const numCuota = cPendiente?.numero_cuota || '?';
                                                            const totalCuotas = pActivo.numero_cuotas || '?';
                                                            
                                                            return (
                                                                <tr key={e.id} className={`hover:bg-white/2 transition-colors ${seleccionados[e.id] ? '' : 'opacity-50'}`}>
                                                                    <td className="p-3 text-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={!!seleccionados[e.id]}
                                                                            onChange={eChecked => handleSelectOne(e.id, eChecked.target.checked)}
                                                                            className="accent-[#00D4FF] w-4 h-4 cursor-pointer"
                                                                        />
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <p className="text-[var(--texto-1)] font-bold">{e.primer_nombre} {e.primer_apellido}</p>
                                                                        <p className="text-[10px] text-[var(--texto-3)] font-mono">{e.cedula}</p>
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <p className="text-[var(--texto-2)] font-semibold">{pActivo.codigo}</p>
                                                                        <p className="text-[10px] text-[#00D4FF] font-bold">Cuota {numCuota} de {totalCuotas}</p>
                                                                    </td>
                                                                    <td className="p-3 text-right text-[var(--texto-2)] font-mono">
                                                                        {formatCOP(cPendiente?.cuota_total || 0)}
                                                                    </td>
                                                                    <td className="p-3 text-right">
                                                                        <input
                                                                            type="number"
                                                                            disabled={!seleccionados[e.id]}
                                                                            value={montosPago[e.id] ?? 0}
                                                                            onChange={evt => handleMontoChange(e.id, evt.target.value)}
                                                                            className="w-full bg-[var(--fondo-base)] border border-[var(--borde)] rounded-lg px-2.5 py-1.5 text-right font-mono text-xs text-[#10B981] font-bold focus:border-[#10B981] outline-none disabled:opacity-50"
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Summary Bar */}
                                            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl gap-4">
                                                <div className="flex gap-4 text-xs font-bold uppercase text-[var(--texto-2)]">
                                                    <div>Seleccionados: <span className="text-white text-sm font-black">{cantidadSeleccionados} / {empleados.length}</span></div>
                                                    <div>Total a Recaudar: <span className="text-[#10B981] text-sm font-black">{formatCOP(totalRecaudado)}</span></div>
                                                </div>
                                                <button
                                                    onClick={procesarDatos}
                                                    disabled={procesando || cantidadSeleccionados === 0}
                                                    className="w-full sm:w-auto bg-[#10B981] hover:bg-[#059669] text-white font-black py-3 px-6 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs uppercase tracking-wider"
                                                >
                                                    {procesando ? (
                                                        <><Loader2 size={16} className="animate-spin" /> PROCESANDO...</>
                                                    ) : (
                                                        <><Save size={16} /> APLICAR RECAUDO MASIVO</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
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
                                        className="mt-4 w-full bg-[#1A6FFF] hover:bg-[#155bd5] text-white font-black py-4 rounded-xl shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-xs uppercase tracking-wider"
                                    >
                                        {procesando ? (
                                            <><Loader2 size={20} className="animate-spin" /> PROCESANDO...</>
                                        ) : (
                                            <><Save size={20} /> APLICAR RECAUDO MASIVO</>
                                        )}
                                    </button>
                                </div>
                            )}
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
