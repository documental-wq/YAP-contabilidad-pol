import React, { useState, useEffect } from 'react'
import api from '../utils/api'
import {
    ClipboardList, Search, ChevronLeft, ChevronRight,
    X, Eye, Calendar, User, Database, Shield,
    Filter, HelpCircle
} from 'lucide-react'

const ACCIONES = [
    { value: 'CREAR_PRESTAMO', label: 'Crear Préstamo', color: 'emerald' },
    { value: 'APROBAR_PRESTAMO', label: 'Aprobar Préstamo', color: 'cyan' },
    { value: 'CANCELAR_PRESTAMO', label: 'Cancelar Préstamo', color: 'rose' },
    { value: 'ELIMINAR_PRESTAMO', label: 'Eliminar Préstamo', color: 'red' },
    { value: 'REGISTRAR_PAGO', label: 'Registrar Pago', color: 'emerald' },
    { value: 'RECAUDO_MASIVO', label: 'Recaudo Masivo', color: 'indigo' },
    { value: 'CREAR_PERSONA', label: 'Crear Cliente', color: 'emerald' },
    { value: 'EDITAR_PERSONA', label: 'Editar Cliente', color: 'amber' },
    { value: 'ELIMINAR_PERSONA', label: 'Eliminar Cliente', color: 'red' },
    { value: 'RESTABLECER_PIN_PORTAL', label: 'Restablecer PIN', color: 'amber' },
    { value: 'RECHAZAR_SOLICITUD', label: 'Rechazar Solicitud', color: 'rose' },
    { value: 'CREAR_USUARIO', label: 'Crear Usuario', color: 'emerald' },
    { value: 'EDITAR_USUARIO', label: 'Editar Usuario', color: 'amber' },
    { value: 'ELIMINAR_USUARIO', label: 'Eliminar Usuario', color: 'red' }
]

const ENTIDADES = [
    { value: 'Prestamo', label: 'Préstamo' },
    { value: 'RegistroPago', label: 'Pago / Abono' },
    { value: 'Persona', label: 'Cliente (Persona)' },
    { value: 'Usuario', label: 'Usuario Admin' }
]

function ActionBadge({ accion }) {
    const matched = ACCIONES.find(a => a.value === accion)
    const color = matched ? matched.color : 'slate'

    const cfg = {
        emerald: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
        cyan: 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]',
        amber: 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
        rose: 'bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]',
        red: 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
        indigo: 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]',
        slate: 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider ${cfg[color]}`}>
            {matched ? matched.label : accion}
        </span>
    )
}

function formatFecha(iso) {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    })
}

export function Auditoria() {
    const [logs, setLogs] = useState([])
    const [total, setTotal] = useState(0)
    const [pagina, setPagina] = useState(1)
    const [totalPaginas, setTotalPaginas] = useState(1)
    const [busqueda, setBusqueda] = useState('')
    const [filtroAccion, setFiltroAccion] = useState('')
    const [filtroEntidad, setFiltroEntidad] = useState('')
    const [cargando, setCargando] = useState(true)
    const [selectedLog, setSelectedLog] = useState(null)
    const limit = 15

    const cargarLogs = async () => {
        try {
            setCargando(true)
            const queryParams = new URLSearchParams({
                page: pagina,
                limit,
                ...(busqueda.trim() && { q: busqueda.trim() }),
                ...(filtroAccion && { accion: filtroAccion }),
                ...(filtroEntidad && { entidad: filtroEntidad })
            })

            const { data } = await api.get(`/auditoria?${queryParams.toString()}`)
            setLogs(data.logs || [])
            setTotal(data.total || 0)
            setTotalPaginas(data.totalPages || 1)
        } catch (error) {
            console.error('Error al cargar bitácora de auditoría:', error)
            setLogs([])
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        cargarLogs()
    }, [pagina, filtroAccion, filtroEntidad])

    const handleSearchSubmit = (e) => {
        e.preventDefault()
        setPagina(1)
        cargarLogs()
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--texto-1)] tracking-wide flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-[var(--cyan)]/10 border border-[var(--cyan)]/20 flex items-center justify-center">
                            <ClipboardList size={18} className="text-[var(--cyan)]" />
                        </span>
                        Bitácora de Auditoría
                    </h1>
                    <p className="text-[var(--texto-3)] text-sm mt-1 ml-12 font-medium">Registro histórico detallado de todas las modificaciones y acciones administrativas</p>
                </div>
            </div>

            {/* Filtros */}
            <form onSubmit={handleSearchSubmit} className="bg-[var(--fondo-card)] border border-[var(--borde)] rounded-2xl p-4 flex flex-col md:flex-row gap-3 shadow-md">
                {/* Búsqueda */}
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--texto-3)]" />
                    <input
                        type="text"
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        placeholder="Buscar por nombre, acción, detalles..."
                        className="w-full bg-[var(--fondo-base)] border border-[var(--borde)] rounded-xl pl-10 pr-4 py-2.5 text-[var(--texto-1)] placeholder-[var(--texto-3)] text-sm focus:outline-none focus:border-[var(--cyan)] transition-all font-medium"
                    />
                </div>
                {/* Filtro Acción */}
                <div className="relative min-w-[180px]">
                    <select
                        value={filtroAccion}
                        onChange={e => { setFiltroAccion(e.target.value); setPagina(1) }}
                        className="w-full bg-[var(--fondo-base)] border border-[var(--borde)] rounded-xl px-4 py-2.5 text-sm text-[var(--texto-1)] appearance-none pr-8 focus:outline-none focus:border-[var(--cyan)] cursor-pointer font-medium"
                    >
                        <option value="">Todas las acciones</option>
                        {ACCIONES.map(a => (
                            <option key={a.value} value={a.value}>{a.label}</option>
                        ))}
                    </select>
                    <Filter size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--texto-3)] pointer-events-none" />
                </div>
                {/* Filtro Entidad */}
                <div className="relative min-w-[150px]">
                    <select
                        value={filtroEntidad}
                        onChange={e => { setFiltroEntidad(e.target.value); setPagina(1) }}
                        className="w-full bg-[var(--fondo-base)] border border-[var(--borde)] rounded-xl px-4 py-2.5 text-sm text-[var(--texto-1)] appearance-none pr-8 focus:outline-none focus:border-[var(--cyan)] cursor-pointer font-medium"
                    >
                        <option value="">Todas las entidades</option>
                        {ENTIDADES.map(e => (
                            <option key={e.value} value={e.value}>{e.label}</option>
                        ))}
                    </select>
                    <Filter size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--texto-3)] pointer-events-none" />
                </div>
                {/* Botón Buscar */}
                <button
                    type="submit"
                    className="bg-[var(--cyan)]/10 text-[var(--cyan)] border border-[var(--cyan)]/20 hover:bg-[var(--cyan)]/20 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                    Buscar
                </button>
            </form>

            {/* Tabla */}
            <div className="bg-[var(--fondo-card)] border border-[var(--borde)] rounded-2xl overflow-hidden shadow-xl">
                {/* Cabecera tabla */}
                <div className="grid grid-cols-[1.5fr_1.5fr_1.5fr_1fr_1fr_0.5fr] gap-4 px-6 py-4 bg-[var(--fondo-base)] border-b border-[var(--borde)] text-[11px] font-bold text-[var(--texto-3)] uppercase tracking-wider">
                    <span>Fecha y Hora</span>
                    <span>Usuario</span>
                    <span>Acción</span>
                    <span>Entidad</span>
                    <span>ID Entidad</span>
                    <span className="text-right">Detalle</span>
                </div>

                {/* Contenido */}
                {cargando ? (
                    <div className="flex flex-col items-center justify-center py-20 text-[var(--texto-3)]">
                        <div className="w-8 h-8 rounded-full border-2 border-[var(--cyan)]/30 border-t-[var(--cyan)] animate-spin mb-3"></div>
                        <p className="text-xs font-semibold">Cargando registros de auditoría...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-[var(--texto-3)]">
                        <ClipboardList size={40} className="mb-3 opacity-40" />
                        <p className="text-sm font-medium">No se encontraron eventos</p>
                        <p className="text-xs mt-1">Modifica los filtros de búsqueda o realiza acciones en la aplicación</p>
                    </div>
                ) : (
                    logs.map((log, index) => (
                        <div
                            key={log.id}
                            className={`grid grid-cols-[1.5fr_1.5fr_1.5fr_1fr_1fr_0.5fr] gap-4 px-6 py-3.5 items-center border-b border-[var(--borde)] hover:bg-[var(--cyan)]/5 transition-all ${index % 2 === 0 ? '' : 'bg-[var(--fondo-base)]/30'}`}
                        >
                            {/* Fecha */}
                            <div className="flex items-center gap-2 text-sm text-[var(--texto-2)] min-w-0">
                                <Calendar size={13} className="text-[var(--texto-3)] flex-shrink-0" />
                                <span className="font-mono text-xs">{formatFecha(log.createdAt)}</span>
                            </div>

                            {/* Usuario */}
                            <div className="flex items-center gap-2 text-sm text-[var(--texto-1)] font-bold min-w-0">
                                <User size={13} className="text-[var(--texto-3)] flex-shrink-0" />
                                <span className="truncate">{log.usuario_nom || 'Sistema'}</span>
                            </div>

                            {/* Acción */}
                            <div className="min-w-0">
                                <ActionBadge accion={log.accion} />
                            </div>

                            {/* Entidad */}
                            <div className="flex items-center gap-2 text-sm text-[var(--texto-2)] font-semibold min-w-0">
                                <Database size={13} className="text-[var(--texto-3)] flex-shrink-0" />
                                <span className="truncate">{ENTIDADES.find(e => e.value === log.entidad)?.label || log.entidad}</span>
                            </div>

                            {/* ID Entidad */}
                            <div className="text-xs font-mono text-[var(--texto-3)] truncate">
                                {log.entidad_id || '—'}
                            </div>

                            {/* Acciones */}
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setSelectedLog(log)}
                                    className="p-1.5 text-[var(--texto-3)] hover:text-[var(--cyan)] hover:bg-[var(--cyan)]/10 rounded-lg transition-all"
                                    title="Ver Detalles Completos"
                                >
                                    <Eye size={15} />
                                </button>
                            </div>
                        </div>
                    ))
                )}

                {/* Paginación */}
                {!cargando && logs.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--borde)] bg-[var(--fondo-base)]/40">
                        <p className="text-[var(--texto-3)] text-xs">
                            Mostrando <span className="text-[var(--texto-1)] font-bold">{(pagina - 1) * limit + 1}–{Math.min(pagina * limit, total)}</span> de <span className="text-[var(--texto-1)] font-bold">{total}</span> registros
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagina(p => Math.max(1, p - 1))}
                                disabled={pagina === 1}
                                className="p-1.5 rounded-lg border border-[var(--borde)] text-[var(--texto-3)] hover:text-[var(--texto-1)] hover:border-[var(--texto-2)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={15} />
                            </button>
                            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                                <button
                                    key={num}
                                    onClick={() => setPagina(num)}
                                    className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${num === pagina
                                        ? 'bg-[var(--cyan)] text-white'
                                        : 'text-[var(--texto-3)] hover:text-[var(--texto-1)] hover:bg-[var(--fondo-base)] border border-[var(--borde)]'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                                disabled={pagina === totalPaginas}
                                className="p-1.5 rounded-lg border border-[var(--borde)] text-[var(--texto-3)] hover:text-[var(--texto-1)] hover:border-[var(--texto-2)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Detalles */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
                    <div className="bg-[var(--fondo-card)] border border-[var(--borde)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-[var(--borde)] bg-[var(--fondo-base)]/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[var(--cyan)]/10 border border-[var(--cyan)]/20 flex items-center justify-center">
                                    <Shield size={18} className="text-[var(--cyan)]" />
                                </div>
                                <div>
                                    <h2 className="text-[var(--texto-1)] font-bold text-lg">Detalles del Evento</h2>
                                    <p className="text-[var(--texto-3)] text-xs">Registro de Auditoría de Alta Seguridad</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="p-2 text-[var(--texto-3)] hover:text-[var(--texto-1)] hover:bg-[var(--fondo-base)] rounded-lg transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4 bg-[var(--fondo-base)]/40 p-4 border border-[var(--borde)] rounded-xl">
                                <div>
                                    <p className="text-[var(--texto-3)] text-[10px] font-bold uppercase tracking-wider">Fecha Completa</p>
                                    <p className="text-[var(--texto-1)] text-sm font-semibold mt-0.5">{formatFecha(selectedLog.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-[var(--texto-3)] text-[10px] font-bold uppercase tracking-wider">Ejecutor</p>
                                    <p className="text-[var(--texto-1)] text-sm font-semibold mt-0.5">{selectedLog.usuario_nom || 'Sistema'}</p>
                                </div>
                                <div className="mt-2">
                                    <p className="text-[var(--texto-3)] text-[10px] font-bold uppercase tracking-wider">Acción Registrada</p>
                                    <div className="mt-1">
                                        <ActionBadge accion={selectedLog.accion} />
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <p className="text-[var(--texto-3)] text-[10px] font-bold uppercase tracking-wider">Entidad Afectada</p>
                                    <p className="text-[var(--texto-1)] text-sm font-semibold mt-0.5">{selectedLog.entidad} ({selectedLog.entidad_id || '—'})</p>
                                </div>
                            </div>

                            {/* JSON Payload Details */}
                            <div>
                                <p className="text-[var(--texto-3)] text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <HelpCircle size={13} />
                                    Carga útil de datos (Payload)
                                </p>
                                <div className="bg-[#1A202C] border border-[#2D3748] p-4 rounded-xl overflow-x-auto text-xs font-mono text-[#E2E8F0] shadow-inner max-h-[300px]">
                                    {selectedLog.detalles ? (
                                        <pre>{JSON.stringify(JSON.parse(selectedLog.detalles), null, 4)}</pre>
                                    ) : (
                                        <span className="italic opacity-50 text-[var(--texto-3)]">No se adjuntaron detalles adicionales para este evento.</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-[var(--borde)] bg-[var(--fondo-base)]/50 flex justify-end">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-5 py-2 bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] hover:from-[#38B2AC] hover:to-[#2C7A7B] text-white rounded-xl text-sm font-bold transition-all shadow-lg"
                            >
                                Cerrar Ventana
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
