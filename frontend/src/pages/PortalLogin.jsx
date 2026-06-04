import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiCliente from '../utils/apiCliente'
import toast from 'react-hot-toast'
import { ShieldCheck, User, KeyRound, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import logoYap from '../assets/logo_yap_dark.png'

export function PortalLogin() {
    const navigate = useNavigate()
    const [cedula, setCedula] = useState('')
    const [password, setPassword] = useState('')
    const [cargando, setCargando] = useState(false)
    
    // Flujo de registro de nuevo PIN
    const [pasoRegistro, setPasoRegistro] = useState(false)
    const [nuevoPin, setNuevoPin] = useState('')
    const [confirmarPin, setConfirmarPin] = useState('')

    // Verificar si ya hay una sesión activa de cliente
    useEffect(() => {
        const token = localStorage.getItem('clienteToken')
        if (token) {
            navigate('/portal/inicio')
        }
    }, [navigate])

    const handleLogin = async (e) => {
        e.preventDefault()
        if (!cedula || !password) {
            return toast.error('Completa todos los campos.')
        }

        setCargando(true)
        try {
            const { data } = await apiCliente.post('/auth/login', {
                cedula: cedula.trim(),
                password: password.trim()
            })

            localStorage.setItem('clienteToken', data.token)
            localStorage.setItem('clienteUsuario', JSON.stringify(data.cliente))

            if (data.requiereRegistroPIN) {
                toast.success('¡Ingreso temporal exitoso! Define tu nuevo PIN.')
                setPasoRegistro(true)
            } else {
                toast.success(`¡Bienvenido de nuevo, ${data.cliente.primer_nombre}!`)
                navigate('/portal/inicio')
            }
        } catch (error) {
            console.error(error)
            toast.error(error.response?.data?.error || 'Error al iniciar sesión. Inténtalo de nuevo.')
        } finally {
            setCargando(false)
        }
    }

    const handleRegistroPin = async (e) => {
        e.preventDefault()
        if (!/^\d{4}$/.test(nuevoPin)) {
            return toast.error('El PIN debe ser de exactamente 4 dígitos numéricos.')
        }
        if (nuevoPin !== confirmarPin) {
            return toast.error('Los PINs no coinciden.')
        }

        setCargando(true)
        try {
            await apiCliente.post('/perfil/cambiar-pin', { nuevoPin })
            toast.success('¡PIN de seguridad configurado exitosamente!')
            
            // Actualizar el estado local del usuario si es necesario
            const cliente = JSON.parse(localStorage.getItem('clienteUsuario') || '{}')
            localStorage.setItem('clienteUsuario', JSON.stringify({ ...cliente, requiereRegistroPIN: false }))
            
            navigate('/portal/inicio')
        } catch (error) {
            console.error(error)
            toast.error(error.response?.data?.error || 'Error al guardar el PIN.')
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#050B14] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Fondo de red táctica cian */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,212,255,0.08),rgba(0,0,0,0))] pointer-events-none" />
            <div className="absolute inset-0 grid-tactical-overlay opacity-20 pointer-events-none" />
            
            {/* Animación del escáner láser */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-[#00D4FF]/30 blur-[1px] animate-laser-scan pointer-events-none" />

            <div className="w-full max-w-[420px] relative z-10">
                {/* Logo & Encabezado */}
                <div className="flex flex-col items-center mb-8">
                    <img 
                        src={logoYap} 
                        alt="YAP Logo" 
                        className="h-16 object-contain drop-shadow-[0_0_15px_rgba(0,212,255,0.25)]"
                    />
                    <h1 className="mt-4 text-2xl font-black uppercase tracking-[0.2em] bg-gradient-to-r from-white via-slate-200 to-[#00D4FF] bg-clip-text text-transparent">
                        YAP CLIENTES
                    </h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.25em] mt-1">
                        Portal de Seguimiento de Créditos
                    </p>
                </div>

                {/* Tarjeta de Formulario Glassmorphic */}
                <div className="bg-[#0A111F]/80 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative">
                    {/* Indicador de estado */}
                    <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 bg-[#060C1A] border border-[#00D4FF]/20 rounded-full flex items-center gap-1.5 shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-ping" />
                        <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">
                            CONEXIÓN_SEGURA
                        </span>
                    </div>

                    {!pasoRegistro ? (
                        /* ================= PASO 1: LOGIN ESTÁNDAR ================= */
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <h2 className="text-lg font-extrabold tracking-tight">Accede a tu cuenta</h2>
                                <p className="text-xs text-slate-400 mt-1">
                                    Ingresa con tu número de cédula y PIN de seguridad.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* Input Cédula */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                        Número de Cédula
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={cedula}
                                            onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-[#040811]/90 border border-white/[0.08] rounded-xl py-3 pl-10 pr-4 text-sm font-semibold focus:outline-none focus:border-[#00D4FF]/50 focus:ring-1 focus:ring-[#00D4FF]/50 transition-all duration-300 placeholder-slate-600 text-white"
                                            placeholder="Ej. 1020456789"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Input PIN / Password */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                        PIN de Ingreso (4 dígitos)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                            <KeyRound className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={12}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-[#040811]/90 border border-white/[0.08] rounded-xl py-3 pl-10 pr-4 text-sm font-semibold focus:outline-none focus:border-[#00D4FF]/50 focus:ring-1 focus:ring-[#00D4FF]/50 transition-all duration-300 placeholder-slate-600 tracking-[0.1em] text-white"
                                            placeholder="••••"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Botón de envío */}
                            <button
                                type="submit"
                                disabled={cargando}
                                className="w-full bg-gradient-to-r from-[#1A6FFF] to-[#00D4FF] hover:from-[#115bd6] hover:to-[#00b9de] disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,212,255,0.15)] transition-all duration-300 mt-2 active:scale-[0.98]"
                            >
                                {cargando ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Verificando...
                                    </>
                                ) : (
                                    <>
                                        Ingresar al Portal
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            {/* Nota de ayuda */}
                            <div className="bg-[#00D4FF]/5 border border-[#00D4FF]/10 rounded-xl p-3 flex items-start gap-2.5 mt-4">
                                <Sparkles className="w-4 h-4 text-[#00D4FF] shrink-0 mt-0.5" />
                                <div className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                                    <span className="text-[#00D4FF] font-bold">¿Primer ingreso?</span> Tu PIN temporal de acceso es tu <span className="underline">número de cédula</span>. Al ingresar se te pedirá cambiarlo.
                                </div>
                            </div>
                        </form>
                    ) : (
                        /* ================= PASO 2: REGISTRO DE PIN NUEVO ================= */
                        <form onSubmit={handleRegistroPin} className="space-y-5">
                            <div>
                                <div className="inline-flex items-center gap-1 bg-[#10B981]/10 border border-[#10B981]/20 rounded-full px-2.5 py-0.5 mb-2 text-[9px] font-bold uppercase tracking-wider text-[#10B981]">
                                    Primer Ingreso Detectado
                                </div>
                                <h2 className="text-lg font-extrabold tracking-tight">Crea tu PIN de Seguridad</h2>
                                <p className="text-xs text-slate-400 mt-1">
                                    Define un código de seguridad de 4 dígitos numéricos para proteger tu cuenta de ahora en adelante.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* Input Nuevo PIN */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                        Nuevo PIN (4 dígitos)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                            <KeyRound className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={4}
                                            value={nuevoPin}
                                            onChange={(e) => setNuevoPin(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-[#040811]/90 border border-white/[0.08] rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:outline-none focus:border-[#10B981]/50 focus:ring-1 focus:ring-[#10B981]/50 transition-all duration-300 placeholder-slate-600 tracking-[0.2em] text-white"
                                            placeholder="••••"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Confirmar PIN */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                        Confirmar tu PIN
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                            <KeyRound className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={4}
                                            value={confirmarPin}
                                            onChange={(e) => setConfirmarPin(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-[#040811]/90 border border-white/[0.08] rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:outline-none focus:border-[#10B981]/50 focus:ring-1 focus:ring-[#10B981]/50 transition-all duration-300 placeholder-slate-600 tracking-[0.2em] text-white"
                                            placeholder="••••"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Botón de envío */}
                            <button
                                type="submit"
                                disabled={cargando}
                                className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#0f9f6e] hover:to-[#04825b] disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.15)] transition-all duration-300 mt-2 active:scale-[0.98]"
                            >
                                {cargando ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Guardando PIN...
                                    </>
                                ) : (
                                    <>
                                        Establecer PIN y Entrar
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer de Habeas Data */}
                <p className="text-center text-[9px] text-slate-600 mt-6 leading-relaxed font-bold">
                    Al ingresar estás aceptando los términos de uso y las políticas de protección de datos (Habeas Data Ley 1581) de YAP S.A.S.
                </p>
            </div>
        </div>
    )
}
