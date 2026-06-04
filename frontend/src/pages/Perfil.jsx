import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import api from '../utils/api';
import { User, Mail, Camera, Save, Loader2 } from 'lucide-react';

const SERVER_URL = 'http://localhost:3001';

export function Perfil() {
    const { usuario, login } = useStore();
    const [nombre, setNombre] = useState(usuario?.nombre || '');
    const [email, setEmail] = useState(usuario?.email || usuario?.correo || '');
    const [fotoUrl, setFotoUrl] = useState(usuario?.foto_url || '');
    const [cargando, setCargando] = useState(false);
    const [subiendoFoto, setSubiendoFoto] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    useEffect(() => {
        if (usuario) {
            setNombre(usuario.nombre);
            setEmail(usuario.email || usuario.correo);
            setFotoUrl(usuario.foto_url);
        }
    }, [usuario]);

    const handleActualizarPerfil = async (e) => {
        e.preventDefault();
        setCargando(true);
        setMensaje({ tipo: '', texto: '' });
        try {
            const res = await api.put('/usuarios/me/perfil', { nombre, email });
            login(res.data, localStorage.getItem('token')); // Actualizar estado global
            setMensaje({ tipo: 'exito', texto: 'Perfil actualizado correctamente.' });
        } catch (error) {
            setMensaje({ tipo: 'error', texto: error.response?.data?.error || 'Error al actualizar perfil.' });
        } finally {
            setCargando(false);
        }
    };

    const handleFotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSubiendoFoto(true);
        const formData = new FormData();
        formData.append('foto', file);

        try {
            const res = await api.post('/usuarios/me/foto', formData);
            setFotoUrl(res.data.foto_url);
            // Actualizar usuario en el store
            const nuevoUsuario = { ...usuario, foto_url: res.data.foto_url };
            login(nuevoUsuario, localStorage.getItem('token'));
            setMensaje({ tipo: 'exito', texto: 'Foto de perfil actualizada.' });
        } catch (error) {
            setMensaje({ tipo: 'error', texto: 'Error al subir la imagen.' });
        } finally {
            setSubiendoFoto(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-[var(--texto-1)] tracking-wide">Ajustes de Perfil</h1>
                <p className="text-[var(--texto-3)] text-sm">Gestiona tu información personal y foto de perfil.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Columna Foto */}
                <div className="bg-[var(--fondo-card)] border border-[var(--borde)] rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 shadow-xl shadow-black/5">
                    <div className="relative group">
                        <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-[var(--cyan)]/30 shadow-2xl bg-[var(--fondo-base)] flex items-center justify-center">
                            {fotoUrl ? (
                                <img
                                    src={fotoUrl.startsWith('http') ? fotoUrl : `${SERVER_URL}${fotoUrl}`}
                                    alt="Perfil"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${nombre || 'Admin'}&background=0A0D14&color=ffffff`
                                    }}
                                />
                            ) : (
                                <User size={80} className="text-slate-400" />
                            )}
                            {subiendoFoto && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                                    <Loader2 className="animate-spin text-white" />
                                </div>
                            )}
                        </div>
                        <label className="absolute bottom-1 right-1 bg-[var(--cyan)] p-2.5 rounded-full cursor-pointer hover:bg-[var(--cyan)]/80 transition-all shadow-lg text-white group-hover:scale-110">
                            <Camera size={20} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleFotoChange} disabled={subiendoFoto} />
                        </label>
                    </div>
                    <div className="text-center">
                        <p className="text-[var(--texto-1)] font-bold">{usuario?.nombre}</p>
                        <p className="text-[var(--texto-3)] text-xs uppercase tracking-widest font-bold">{usuario?.rol}</p>
                    </div>
                </div>

                {/* Columna Formulario */}
                <div className="md:col-span-2 bg-[var(--fondo-card)] border border-[var(--borde)] rounded-2xl p-8 shadow-xl">
                    <form onSubmit={handleActualizarPerfil} className="space-y-6">
                        {mensaje.texto && (
                            <div className={`p-4 rounded-xl text-sm font-medium ${mensaje.tipo === 'exito' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                {mensaje.texto}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-[var(--texto-3)] uppercase tracking-widest">Nombre Completo</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--texto-3)]" size={18} />
                                    <input
                                        type="text"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        className="w-full bg-[var(--fondo-base)] border border-[var(--borde)] rounded-xl py-3 pl-10 pr-4 text-[var(--texto-1)] focus:ring-2 focus:ring-[var(--cyan)]/50 outline-none transition-all font-medium"
                                        placeholder="Tu nombre"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-[var(--texto-3)] uppercase tracking-widest">Correo Electrónico</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--texto-3)]" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[var(--fondo-base)] border border-[var(--borde)] rounded-xl py-3 pl-10 pr-4 text-[var(--texto-1)] focus:ring-2 focus:ring-[var(--cyan)]/50 outline-none transition-all font-medium"
                                        placeholder="correo@ejemplo.com"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={cargando}
                            className="w-full bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] hover:from-[#38B2AC] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group"
                        >
                            {cargando ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="group-hover:scale-110 transition-transform" />}
                            <span>Guardar Cambios</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
