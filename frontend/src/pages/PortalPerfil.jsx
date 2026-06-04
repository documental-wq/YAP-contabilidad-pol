import React, { useState, useEffect } from 'react'
import apiCliente from '../utils/apiCliente'
import toast from 'react-hot-toast'
import { 
    User, 
    ShieldCheck, 
    Smartphone, 
    Mail, 
    Lock, 
    Check, 
    Loader2 
} from 'lucide-react'

export function PortalPerfil() {
    const [cliente, setCliente] = useState(null)
    const [pinActual, setPinActual] = useState('')
    const [nuevoPin, setNuevoPin] = useState('')
    const [confirmarPin, setConfirmarPin] = useState('')
    const [cargando, setCargando] = useState(false)

    useEffect(() => {
        const usuarioData = localStorage.getItem('clienteUsuario')
        if (usuarioData) {
            setCliente(JSON.parse(usuarioData))
        }
    }, [])

    const handleActualizarPin = async (e) => {
        e.preventDefault()

        if (!/^\d{4}$/.test(nuevoPin)) {
            return toast.error('El nuevo PIN debe tener exactamente 4 dígitos numéricos.')
        }

        if (nuevoPin !== confirmarPin) {
            return toast.error('La confirmación del PIN no coincide.')
        }

        setCargando(true)
        try {
            await apiCliente.post('/perfil/cambiar-pin', { nuevoPin })
            toast.success('¡Tu PIN de seguridad se ha actualizado con éxito!')
            
            // Limpiar inputs
            setPinActual('')
            setNuevoPin('')
            setConfirmarPin('')
        } catch (error) {
            console.error(error)
            toast.error(error.response?.data?.error || 'No se pudo actualizar el PIN.')
        } finally {
            setCargando(false)
        }
    }

    if (!cliente) return null

    return (
        <div className="space-y-6 max-w-lg mx-auto">
            {/* Cabecera */}
            <div className="flex flex-col gap-1">
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-wide text-white">
                    Mi Perfil
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                    Gestiona tus credenciales de acceso seguro y visualiza tus datos personales registrados.
                </p>
            </div>

            {/* Ficha de datos personales */}
            <div className="bg-[#0A111F]/80 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-5 md:p-6 shadow-md space-y-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#00D4FF]/[0.01] to-transparent pointer-events-none" />
                
                <div className="flex items-center gap-4 border-b border-white/[0.04] pb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1A6FFF] to-[#00D4FF] flex items-center justify-center text-base font-black text-white shadow-md">
                        {cliente.primer_nombre[0]}{cliente.primer_apellido[0]}
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white">{cliente.nombre}</h3>
                        <span className="text-[10px] text-slate-500 font-mono">Deudor registrado</span>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Cédula */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Documento de Identidad</span>
                            <span className="block text-xs font-bold text-slate-300 font-mono mt-0.5">C.C. {cliente.cedula}</span>
                        </div>
                    </div>

                    {/* Celular */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                            <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Número de Celular</span>
                            <span className="block text-xs font-bold text-slate-300 mt-0.5">{cliente.celular || 'No registrado'}</span>
                        </div>
                    </div>

                    {/* Correo */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                            <Mail className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Correo Electrónico</span>
                            <span className="block text-xs font-bold text-slate-300 mt-0.5 truncate max-w-[240px]">{cliente.correo || 'No registrado'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Formulario de cambio de PIN */}
            <div className="bg-[#0A111F]/80 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-5 md:p-6 shadow-md space-y-4">
                <div className="border-b border-white/[0.04] pb-4 flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-[#00D4FF]" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">
                        Cambiar PIN de Seguridad
                    </h3>
                </div>

                <form onSubmit={handleActualizarPin} className="space-y-4">
                    {/* Nuevo PIN */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black tracking-widest text-slate-400">
                            Nuevo PIN de Seguridad
                        </label>
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            value={nuevoPin}
                            onChange={(e) => setNuevoPin(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-[#040811]/90 border border-white/[0.08] rounded-xl py-3 px-4 text-xs font-bold tracking-[0.2em] focus:outline-none focus:border-[#00D4FF]/50 focus:ring-1 focus:ring-[#00D4FF]/50 transition-all duration-300 placeholder-slate-700 text-white"
                            placeholder="••••"
                            required
                        />
                        <span className="block text-[8px] text-slate-500 font-bold uppercase mt-1">
                            Código numérico de exactamente 4 dígitos.
                        </span>
                    </div>

                    {/* Confirmar PIN */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black tracking-widest text-slate-400">
                            Confirmar Nuevo PIN
                        </label>
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            value={confirmarPin}
                            onChange={(e) => setConfirmarPin(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-[#040811]/90 border border-white/[0.08] rounded-xl py-3 px-4 text-xs font-bold tracking-[0.2em] focus:outline-none focus:border-[#00D4FF]/50 focus:ring-1 focus:ring-[#00D4FF]/50 transition-all duration-300 placeholder-slate-700 text-white"
                            placeholder="••••"
                            required
                        />
                    </div>

                    {/* Botón de envío */}
                    <button
                        type="submit"
                        disabled={cargando}
                        className="w-full bg-gradient-to-r from-[#1A6FFF] to-[#00D4FF] hover:from-[#115bd6] hover:to-[#00b9de] disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,212,255,0.15)] transition-all duration-300 active:scale-[0.98]"
                    >
                        {cargando ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Actualizando...
                            </>
                        ) : (
                            <>
                                Guardar Nuevo PIN
                                <Check className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
