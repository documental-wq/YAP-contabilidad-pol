import React, { Suspense } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useStore } from '../../store/useStore'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { Loader2 } from 'lucide-react'

// Componente de carga para Suspense
function PageLoader() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
                    <div className="absolute inset-0 border-4 border-[#1A6FFF] border-t-transparent rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="w-2 h-2 bg-[#00D4FF] rounded-full animate-ping" />
                    </div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Cargando módulo...</p>
            </div>
        </div>
    )
}

export function Layout() {
    const { usuario, vistaPremium } = useStore()

    if (!usuario) {
        return <Navigate to="/login" replace />
    }

    return (
        <div
            data-theme={vistaPremium ? 'premium' : 'teamhub'}
            className={`min-h-screen flex overflow-hidden transition-all duration-500 ${vistaPremium ? 'bg-[#060C1A] text-slate-100' : 'bg-slate-50 text-slate-900'
                }`}
        >
            {/* CINEMATIC KERNEL LOADER (ONLY ON MOUNT) */}
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#060C1A] animate-fade-out pointer-events-none" style={{ animationDelay: '1.2s' }}>
                <div className="w-64 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[var(--cyan)] font-black uppercase tracking-[0.3em]">YAP_KERNEL_INIT</span>
                        <span className="text-[10px] text-white font-mono">v2.5.0-STABLE</span>
                    </div>
                    <div className="h-[2px] w-full bg-white/10 relative overflow-hidden rounded-full">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#38B2AC] to-[#00D4FF] animate-kernel-init"></div>
                    </div>
                    <div className="flex items-center justify-between opacity-50">
                        <span className="text-[8px] text-white font-mono uppercase">Neural_Auth_Ready</span>
                        <span className="text-[8px] text-white font-mono uppercase">Data_Node_Sync</span>
                    </div>
                </div>
            </div>

            {/* HUD OVERLAY - TACTICAL GRID */}
            <div className="fixed inset-0 pointer-events-none z-0 grid-tactical-overlay opacity-30"></div>
            
            <div className="grid-tactical-overlay" />
            <div className="parallax-grid-overlay" />
            <div className="neural-background-pulse" />
            
            {/* Global Scanning Laser */}
            <div className={`absolute inset-0 pointer-events-none z-[-1] opacity-20 ${vistaPremium ? 'block' : 'hidden'}`}>
                <div className="w-full h-[1px] bg-cyan-400 absolute animate-laser-scan blur-[2px]"></div>
            </div>

            <div className="status-watermark">SYSTEM_STATUS: OPTIMIZED | NEURAL_LINK: ACTIVE</div>

            {/* NEURAL TELEMETRY HUD */}
            <div className={`telemetry-hud ${vistaPremium ? 'block' : 'hidden'}`}>
                <div className="telemetry-line"><span className="telemetry-tag">[OK]</span> NEURAL_SYNC_SUCCESS</div>
                <div className="telemetry-line"><span className="telemetry-tag">[OK]</span> AES256_ENCRYPTION_ACTIVE</div>
                <div className="telemetry-line"><span className="telemetry-tag">[PR]</span> MONITORING_RISK_FACTORS</div>
                <div className="telemetry-line"><span className="telemetry-tag">[SY]</span> SYSTEM_READY_FOR_DELIVERY</div>
            </div>

            {/* YAP LEGENDARY WATERMARK */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
                <img 
                    src="/src/assets/logo_yap_dark.png" 
                    alt="" 
                    className="w-[800px] h-[800px] object-contain opacity-[0.02] animate-brand-watermark filter grayscale"
                />
            </div>

            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#121621',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        padding: '12px 20px',
                        backdropFilter: 'blur(10px)',
                        fontSize: '14px',
                        fontWeight: '600'
                    },
                    success: {
                        iconTheme: {
                            primary: '#10B981',
                            secondary: '#fff',
                        },
                    },
                }}
            />
            <Sidebar />

            <main className="flex-1 flex flex-col overflow-hidden h-screen">
                <Topbar />
                <div className={`flex-1 overflow-y-auto p-4 md:p-8 transition-colors duration-500 ${vistaPremium ? 'bg-[#060C1A]/95' : 'bg-white'
                    }`}>
                    <div className="max-w-[1700px] mx-auto">
                        {/* ErrorBoundary: captura crashes de cualquier página y muestra UI amigable */}
                        <ErrorBoundary>
                            <Suspense fallback={<PageLoader />}>
                                <Outlet />
                            </Suspense>
                        </ErrorBoundary>
                    </div>
                </div>
            </main>
        </div>
    )
}
