import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useLocation } from 'react-router-dom';

/**
 * ErrorBoundaryInner — clase React que captura errores de renderizado.
 * No puede ser un hook (por eso usamos clase). El HOC externo le inyecta
 * la 'location' para que pueda resetearse automáticamente al navegar.
 */
class ErrorBoundaryInner extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('🔴 [ErrorBoundary] Crash capturado:', error?.message);
        console.error('Componente stack:', info?.componentStack?.split('\n')?.slice(0, 6)?.join('\n'));
    }

    // CLAVE: Resetear estado cuando el usuario navega a otra página
    componentDidUpdate(prevProps) {
        if (this.state.hasError && prevProps.location !== this.props.location) {
            this.setState({ hasError: false, error: null });
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[60vh] flex items-center justify-center p-8">
                    <div className="max-w-md w-full">
                        <div className="bg-[#0d1117] border border-red-500/30 rounded-3xl p-10 text-center shadow-[0_0_80px_rgba(244,63,94,0.1)]">
                            {/* Icono animado */}
                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 relative">
                                <div className="absolute inset-0 rounded-full bg-red-500/5 animate-ping" />
                                <AlertTriangle className="text-red-400 relative z-10" size={36} />
                            </div>

                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                                Error de Módulo
                            </h2>
                            <p className="text-slate-400 text-sm mb-1">
                                Esta sección encontró un problema al cargar.
                            </p>
                            <p className="text-slate-500 text-xs mb-6">
                                Navega a otra sección — el error se limpiará automáticamente.
                            </p>

                            {/* Detalle técnico del error */}
                            {this.state.error && (
                                <div className="mb-6 p-3 bg-black/50 rounded-xl border border-white/5 text-left max-h-24 overflow-y-auto">
                                    <p className="text-[10px] font-mono text-red-400 break-all leading-relaxed">
                                        {this.state.error.toString()}
                                    </p>
                                </div>
                            )}

                            {/* Botones de acción */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        this.setState({ hasError: false, error: null });
                                        window.location.reload();
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 active:scale-95 text-red-400 border border-red-500/20 font-bold py-3 px-4 rounded-2xl transition-all text-sm"
                                >
                                    <RefreshCw size={15} />
                                    Recargar
                                </button>
                                <button
                                    onClick={() => {
                                        this.setState({ hasError: false, error: null });
                                        window.location.href = '/inicio';
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 bg-[#1A6FFF]/10 hover:bg-[#1A6FFF]/20 active:scale-95 text-[#00D4FF] border border-[#1A6FFF]/20 font-bold py-3 px-4 rounded-2xl transition-all text-sm"
                                >
                                    <Home size={15} />
                                    Ir al Inicio
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * ErrorBoundary — HOC wrapper funcional que inyecta la location actual
 * en el ErrorBoundaryInner para permitir el auto-reset al navegar.
 * 
 * Uso: <ErrorBoundary>{children}</ErrorBoundary>
 */
export function ErrorBoundary({ children }) {
    const location = useLocation();
    return (
        <ErrorBoundaryInner location={location}>
            {children}
        </ErrorBoundaryInner>
    );
}
