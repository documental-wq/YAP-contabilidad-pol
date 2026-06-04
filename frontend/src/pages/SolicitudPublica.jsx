import React, { useState, useEffect } from 'react'
import { FileText, User, Phone, Mail, Briefcase, DollarSign, MessageSquare, CheckCircle, Building, ChevronRight, Loader2 } from 'lucide-react'
import api, { disableOfflineMode } from '../utils/api'
import logoYapDark from '../assets/logo_yap_dark.png'

export function SolicitudPublica() {
    const [empresas, setEmpresas] = useState([])
    const [cargandoEmpresas, setCargandoEmpresas] = useState(true)
    const [loading, setLoading] = useState(false)
    const [exito, setExito] = useState(false)
    const [error, setError] = useState('')
    
    const [solicitudResult, setSolicitudResult] = useState(null)

    const [formData, setFormData] = useState({
        primer_nombre: '',
        segundo_nombre: '',
        primer_apellido: '',
        segundo_apellido: '',
        cedula: '',
        celular: '',
        telefono: '',
        correo: '',
        empresa_id: '',
        cargo: '',
        monto_requerido: '',
        observaciones: ''
    })

    useEffect(() => {
        const cargarEmpresas = async () => {
            // Aseguramos que el modo offline no bloquee el formulario público
            disableOfflineMode()
            try {
                // Endpoint público: no requiere autenticación
                const res = await api.get('/publico/empresas')
                setEmpresas(res.data?.empresas || [])
            } catch (err) {
                console.error("Error cargando empresas:", err)
            } finally {
                setCargandoEmpresas(false)
            }
        }
        cargarEmpresas()
    }, [])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (!formData.primer_nombre || !formData.primer_apellido || !formData.cedula || !formData.celular || !formData.empresa_id || !formData.monto_requerido) {
            setError('Por favor, rellene todos los campos obligatorios (*).')
            setLoading(false)
            return
        }

        try {
            const res = await api.post('/publico/solicitar', formData)
            setSolicitudResult(res.data?.persona || null)
            setExito(true)
        } catch (err) {
            console.error("Error registrando solicitud:", err)
            setError(err.response?.data?.error || 'Ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente.')
        } finally {
            setLoading(false)
        }
    }

    if (exito) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#060C1A] relative overflow-hidden p-4">
                <div className="absolute inset-0 dot-grid-bg pointer-events-none" />
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#10B981] rounded-full blur-[130px] opacity-[0.10] pointer-events-none animate-pulse-glow" />
                
                <div className="w-full max-w-lg relative z-10 glass-effect p-8 md:p-12 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.7)] border border-white/5 text-center animate-fade-slide-in">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-8 animate-bounce-slow shadow-[0_0_50px_rgba(16,185,129,0.15)]">
                        <CheckCircle size={48} className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                    </div>

                    <h1 className="header-font text-3xl font-black text-white tracking-tight mb-4">
                        ¡Solicitud Recibida!
                    </h1>
                    
                    <p className="text-slate-400 text-sm leading-relaxed mb-8">
                        Hola <strong className="text-white">{formData.primer_nombre}</strong>, tu solicitud de crédito por libranza ha sido registrada en nuestro sistema de forma exitosa.
                    </p>

                    {solicitudResult?.turno && (
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 mb-8 inline-block w-full">
                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em] mb-2">Tu Número en la Fila</p>
                            <p className="text-5xl font-black text-white tracking-tight number-font drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                                #{solicitudResult.turno}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-2">Estudio de crédito asignado secuencialmente</p>
                        </div>
                    )}

                    <div className="space-y-4 text-left bg-white/2 p-6 rounded-2xl border border-white/5 mb-8 text-xs text-slate-400 leading-relaxed">
                        <p className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-[#1A6FFF]/20 text-[#60A5FA] flex items-center justify-center font-bold flex-shrink-0">1</span>
                            <span><strong>Validación de datos:</strong> Nuestro equipo de analistas de libranza revisará tu información.</span>
                        </p>
                        <p className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-[#1A6FFF]/20 text-[#60A5FA] flex items-center justify-center font-bold flex-shrink-0">2</span>
                            <span><strong>Llamada de confirmación:</strong> Te contactaremos al número celular registrado para coordinar los detalles.</span>
                        </p>
                    </div>

                    <p className="text-slate-500 text-[10px] uppercase tracking-widest">
                        YAP S.A.S. · Solicitud Cifrada y Segura
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#060C1A] relative overflow-hidden p-4 py-12">
            {/* Dot grid background */}
            <div className="absolute inset-0 dot-grid-bg pointer-events-none" />

            {/* Glow orbs */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#4FD1C5] rounded-full blur-[140px] opacity-[0.08] pointer-events-none animate-pulse-glow" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-400 rounded-full blur-[140px] opacity-[0.05] pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }} />

            <div className="w-full max-w-2xl relative z-10 animate-fade-slide-in">
                {/* Brand Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 rounded-[24px] bg-[#060C1A] flex items-center justify-center relative glass-effect border border-white/10 mb-4 shadow-[0_0_50px_rgba(79,209,197,0.15)]">
                        <img
                            src={logoYapDark}
                            alt="Logo"
                            className="w-[80%] h-[80%] object-contain"
                            onError={(e) => { e.target.style.display = 'none' }}
                        />
                        {/* Simular ícono si no carga imagen */}
                        <FileText size={24} className="text-[#4FD1C5] absolute" style={{ display: logoYapDark ? 'none' : 'block' }} />
                    </div>

                    <h1 className="header-font text-3xl font-black text-white tracking-tight text-center">
                        Solicitud de Crédito
                    </h1>
                    <p className="text-[10px] text-[#4FD1C5] font-black tracking-[0.25em] uppercase mt-1">Libranza Digital YAP</p>
                </div>

                {/* Form card */}
                <div className="glass-effect p-8 md:p-10 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.7)] border border-white/5">
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-8 text-center border-b border-white/5 pb-4">
                        Diligencia el formulario para iniciar tu estudio de crédito
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-xs text-center flex items-center gap-2 justify-center animate-fade-in">
                                {error}
                            </div>
                        )}

                        {/* Fila 1: Nombres */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="group">
                                <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-2">
                                    Primer Nombre *
                                </label>
                                <div className="relative">
                                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#4FD1C5] transition-colors" />
                                    <input
                                        type="text"
                                        name="primer_nombre"
                                        value={formData.primer_nombre}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 cyber-input rounded-xl focus:outline-none transition-all text-sm"
                                        placeholder="Ej: Juan"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-2">
                                    Segundo Nombre
                                </label>
                                <div className="relative">
                                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#4FD1C5] transition-colors" />
                                    <input
                                        type="text"
                                        name="segundo_nombre"
                                        value={formData.segundo_nombre}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 cyber-input rounded-xl focus:outline-none transition-all text-sm"
                                        placeholder="Ej: Carlos (Opcional)"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Fila 2: Apellidos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="group">
                                <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-2">
                                    Primer Apellido *
                                </label>
                                <div className="relative">
                                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#4FD1C5] transition-colors" />
                                    <input
                                        type="text"
                                        name="primer_apellido"
                                        value={formData.primer_apellido}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 cyber-input rounded-xl focus:outline-none transition-all text-sm"
                                        placeholder="Ej: Pérez"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-2">
                                    Segundo Apellido
                                </label>
                                <div className="relative">
                                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#4FD1C5] transition-colors" />
                                    <input
                                        type="text"
                                        name="segundo_apellido"
                                        value={formData.segundo_apellido}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 cyber-input rounded-xl focus:outline-none transition-all text-sm"
                                        placeholder="Ej: Gómez (Opcional)"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Fila 3: Cédula y Celular */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="group">
                                <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-2">
                                    Cédula de Ciudadanía *
                                </label>
                                <div className="relative">
                                    <FileText size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#4FD1C5] transition-colors" />
                                    <input
                                        type="text"
                                        name="cedula"
                                        value={formData.cedula}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 cyber-input rounded-xl focus:outline-none transition-all text-sm font-mono"
                                        placeholder="Ej: 10203040"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-2">
                                    Celular / Móvil *
                                </label>
                                <div className="relative">
                                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#4FD1C5] transition-colors" />
                                    <input
                                        type="tel"
                                        name="celular"
                                        value={formData.celular}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 cyber-input rounded-xl focus:outline-none transition-all text-sm"
                                        placeholder="Ej: 3001234567"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Fila 4: Correo y Teléfono Opcional */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="group">
                                <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-2">
                                    Correo Electrónico
                                </label>
                                <div className="relative">
                                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#4FD1C5] transition-colors" />
                                    <input
                                        type="email"
                                        name="correo"
                                        value={formData.correo}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 cyber-input rounded-xl focus:outline-none transition-all text-sm"
                                        placeholder="Ej: juan.perez@correo.com"
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-2">
                                    Teléfono Fijo / Alternativo
                                </label>
                                <div className="relative">
                                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#4FD1C5] transition-colors" />
                                    <input
                                        type="tel"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 cyber-input rounded-xl focus:outline-none transition-all text-sm"
                                        placeholder="Ej: 6012345678"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Fila 5: Empresa y Cargo */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="group">
                                <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-2">
                                    Empresa Empleadora (Libranza) *
                                </label>
                                <div className="relative">
                                    <Building size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#4FD1C5] transition-colors z-10" />
                                    <select
                                        name="empresa_id"
                                        value={formData.empresa_id}
                                        onChange={handleChange}
                                        disabled={cargandoEmpresas}
                                        className="w-full pl-10 pr-4 py-3 cyber-input rounded-xl focus:outline-none transition-all text-sm appearance-none bg-slate-900/60 text-white disabled:opacity-50"
                                        required
                                    >
                                        <option value="">{cargandoEmpresas ? 'Cargando empresas...' : 'Selecciona tu empresa...'}</option>
                                        {empresas.map(emp => (
                                            <option key={emp.id} value={emp.id} className="bg-[#0c1526] text-white">
                                                {emp.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-2">
                                    Cargo / Ocupación
                                </label>
                                <div className="relative">
                                    <Briefcase size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#4FD1C5] transition-colors" />
                                    <input
                                        type="text"
                                        name="cargo"
                                        value={formData.cargo}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 cyber-input rounded-xl focus:outline-none transition-all text-sm"
                                        placeholder="Ej: Operario, Docente, Analista"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Fila 6: Monto Requerido */}
                        <div className="group">
                            <label className="block text-[#4FD1C5] text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                                Monto del Crédito Requerido ($ COP) *
                            </label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4FD1C5] drop-shadow-[0_0_5px_rgba(79,209,197,0.4)] z-10" />
                                <input
                                    type="number"
                                    name="monto_requerido"
                                    value={formData.monto_requerido}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-4 rounded-xl focus:outline-none transition-all duration-300 bg-[#4FD1C5]/5 border border-[#4FD1C5]/30 text-[#4FD1C5] font-black text-xl placeholder:text-[#4FD1C5]/30 focus:border-[#4FD1C5] focus:shadow-[0_0_15px_rgba(79,209,197,0.2)]"
                                    placeholder="Ej: 1500000"
                                    min="100000"
                                    required
                                />
                            </div>
                        </div>

                        {/* Fila 7: Observaciones */}
                        <div className="group">
                            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-2">
                                Observaciones / Comentarios adicionales
                            </label>
                            <div className="relative">
                                <MessageSquare size={14} className="absolute left-3.5 top-3.5 text-slate-600 group-focus-within:text-[#4FD1C5] transition-colors" />
                                <textarea
                                    name="observaciones"
                                    value={formData.observaciones}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full pl-10 pr-4 py-3 cyber-input rounded-xl focus:outline-none transition-all text-sm resize-none"
                                    placeholder="Cuéntanos algún detalle adicional sobre tu solicitud..."
                                />
                            </div>
                        </div>

                        {/* Botón de envío */}
                        <button
                            type="submit"
                            disabled={loading || cargandoEmpresas}
                            className="w-full mt-8 relative overflow-hidden bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] hover:from-[#38B2AC] hover:to-[#2C7A7B] text-white font-black py-4 rounded-2xl transition-all shadow-[0_8px_30px_rgba(79,209,197,0.3)] flex items-center justify-center gap-2 text-sm uppercase tracking-widest disabled:opacity-50 group"
                        >
                            {/* Scanning laser visual */}
                            <div className="absolute inset-x-0 h-[1px] bg-white/40 shadow-[0_0_10px_white] animate-laser-scan opacity-0 group-hover:opacity-100 z-10 pointer-events-none"></div>

                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Procesando Solicitud...</span>
                                </>
                            ) : (
                                <>
                                    <span>Enviar Solicitud</span>
                                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-slate-600 text-[9px] text-center mt-6 uppercase tracking-widest">
                    Los datos ingresados están protegidos por la Ley 1581 de Habeas Data · Sesión Cifrada AES-256-GCM
                </p>
            </div>
        </div>
    )
}
