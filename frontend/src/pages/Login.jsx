import React, { useState } from 'react'
import logoYapDark from '../assets/logo_yap_dark.png'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import api from '../utils/api'
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2, ArrowRight } from 'lucide-react'

export function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [mostrar, setMostrar] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [config, setConfig] = useState(null)

    const navigate = useNavigate()
    const { login } = useStore()

    React.useEffect(() => {
        const cargarConfig = async () => {
            try {
                const res = await api.get('/configuracion')
                setConfig(res.data?.configuraciones || null)
            } catch (err) {
                console.error("No se pudo cargar config en login", err)
            }
        }
        cargarConfig()
    }, [])

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await api.post('/auth/login', { correo: email, password })
            login(res.data?.usuario || {}, res.data?.token || '', res.data?.refreshToken || null)
            navigate('/inicio')
        } catch (err) {
            console.error("Error en login:", err)
            if (!err.response) {
                setError('❌ ERROR DE CONEXIÓN: El servidor backend no responde. Por favor, asegúrate de que tu backend esté encendido en Render y conectado a la base de datos.')
            } else if (err.response.status === 404) {
                setError('❌ ERROR 404: El servidor de backend no se encuentra en la URL configurada. Asegúrate de haber creado el servicio en Render con el nombre "yap-app-backend".')
            } else {
                setError(err.response.data?.error || 'Credenciales incorrectas. Intente nuevamente.')
            }
        } finally {
            setLoading(false)
        }
    }

    const nombreEmpresa = config?.nombre_empresa || "YAP"
    const logoEmpresa = config?.logo_empresa

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#060C1A] relative overflow-hidden">
            {/* Dot grid background */}
            <div className="absolute inset-0 dot-grid-bg pointer-events-none" />

            {/* Ambient glow orbs */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#4FD1C5] rounded-full blur-[140px] opacity-[0.12] pointer-events-none animate-pulse-glow" />
            <div
                className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-400 rounded-full blur-[140px] opacity-[0.07] pointer-events-none animate-pulse-glow"
                style={{ animationDelay: '2s' }}
            />

            {/* Main card */}
            <div className="w-full max-w-md relative z-10 animate-fade-slide-in px-4" style={{ animationDelay: '0.1s' }}>
                {/* Logo section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="mb-10 group/logo">
                        <div className="w-40 h-40 rounded-[48px] transition-all duration-700 flex items-center justify-center animate-glow-rotate p-[4px] shadow-[0_0_100px_rgba(79,209,197,0.2)] group-hover/logo:scale-110 group-hover/logo:rotate-1 animate-glitch-pulse">
                            <div className="w-full h-full rounded-[44px] overflow-hidden bg-[#060C1A] flex items-center justify-center animate-logo-shimmer animate-laser-scan relative glass-effect border border-white/10">
                                <img
                                    src={logoEmpresa || logoYapDark}
                                    alt="Logo"
                                    className="w-[85%] h-[85%] object-contain animate-float-ultra drop-shadow-[0_0_25px_rgba(79,209,197,0.4)]"
                                    onError={(e) => { e.target.style.display = 'none' }}
                                />
                            </div>
                        </div>
                    </div>

                    <h1 className="header-font text-4xl font-black text-white tracking-tight text-center">
                        {nombreEmpresa}
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#4FD1C5]" />
                        <p className="text-[10px] text-[#4FD1C5] font-black tracking-[0.25em] uppercase">Sistema Financiero</p>
                        <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#4FD1C5]" />
                    </div>
                </div>

                {/* Form card */}
                <div className="glass-effect p-8 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.7)] border border-white/5">
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-6 text-center">
                        Iniciar sesión
                    </p>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm text-center flex items-center gap-2 justify-center animate-fade-in">
                                {error}
                            </div>
                        )}

                        {/* Email */}
                        <div className="group">
                            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <Mail
                                    size={16}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#4FD1C5] transition-colors"
                                />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 cyber-input rounded-xl focus:outline-none transition-all duration-300"
                                    placeholder="usuario@empresa.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="group">
                            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock
                                    size={16}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#4FD1C5] transition-colors"
                                />
                                <input
                                    type={mostrar ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 pl-10 pr-12 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#4FD1C5] focus:border-[#4FD1C5] transition-all placeholder:text-slate-600"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setMostrar(!mostrar)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-6 relative overflow-hidden bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] hover:from-[#38B2AC] hover:to-[#2C7A7B] text-white font-black py-3.5 rounded-xl transition-all shadow-[0_8px_30px_rgba(79,209,197,0.4)] flex items-center justify-center gap-2 text-sm uppercase tracking-widest disabled:opacity-60 group cyber-glitch"
                        >
                            {/* SUPREME SCAN LINE */}
                            <div className="absolute inset-x-0 h-[1px] bg-white/40 shadow-[0_0_10px_white] animate-laser-scan opacity-0 group-hover:opacity-100 z-10 pointer-events-none"></div>

                            {/* Shimmer overlay */}
                            <span className="absolute inset-0 w-full translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Iniciando YAP...</span>
                                </>
                            ) : (
                                <>
                                    <span>Acceder al Sistema</span>
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-slate-600 text-[10px] text-center mt-6 uppercase tracking-widest">
                        Acceso autorizado · Sesión cifrada
                    </p>
                </div>

                <p className="text-slate-700 text-[10px] text-center mt-6 font-bold uppercase tracking-[0.3em]">
                    Powered by YAP Sistema Financiero
                </p>
            </div>
        </div>
    )
}
