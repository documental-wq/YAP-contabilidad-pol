import React from 'react';

export function Loader({ message = "Cargando...", overlay = false }) {
    const LoaderContent = (
        <div className="flex flex-col items-center justify-center gap-6">
            <div className="relative size-20 flex items-center justify-center">
                {/* Outer Glow */}
                <div className="absolute inset-0 bg-[#00D4FF]/20 blur-2xl rounded-full animate-pulse"></div>

                {/* Outer Ring */}
                <div className="absolute inset-0 premium-loader-ring"></div>

                {/* Middle Ring - Reverse */}
                <div className="absolute inset-2 border-2 border-t-transparent border-r-[#10B981] border-b-transparent border-l-[#10B981] rounded-full animate-spin [animation-duration:1.5s] [animation-direction:reverse]"></div>

                {/* Inner Core */}
                <div className="size-4 bg-white rounded-full glow-cyan animate-pulse"></div>
            </div>

            {message && (
                <div className="flex flex-col items-center">
                    <p className="text-white text-[10px] font-black tracking-[0.4em] uppercase">
                        {message}
                    </p>
                    <div className="w-32 h-0.5 bg-white/5 mt-2 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent shimmer-effect"></div>
                    </div>
                </div>
            )}
        </div>
    );

    if (overlay) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05050A]/90 backdrop-blur-xl animate-fade-in">
                {LoaderContent}
            </div>
        );
    }

    return LoaderContent;
}
