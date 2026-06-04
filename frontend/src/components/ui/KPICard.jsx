import React from 'react'
import { useStore } from '../../store/useStore'
import { cn } from '../../utils/cn'

export function KPICard({ title, value, icon: Icon, trend, color = 'blue' }) {
    const { vistaPremium } = useStore()

    const colorConfig = {
        blue: { text: "text-cyan-400", border: "border-cyan-500/30", glow: "shadow-[0_0_20px_rgba(34,211,238,0.2)]" },
        cyan: { text: "text-cyan-400", border: "border-cyan-500/30", glow: "shadow-[0_0_20px_rgba(34,211,238,0.2)]" },
        amber: { text: "text-amber-400", border: "border-amber-500/30", glow: "shadow-[0_0_20px_rgba(251,191,36,0.2)]" },
        rose: { text: "text-rose-400", border: "border-rose-500/30", glow: "shadow-[0_0_20px_rgba(244,63,94,0.2)]" },
        emerald: { text: "text-emerald-400", border: "border-emerald-500/30", glow: "shadow-[0_0_20px_rgba(16,185,129,0.2)]" }
    }

    const current = colorConfig[color] || colorConfig.blue

    return (
        <div className={`magic-border-container ${vistaPremium ? 'magic-border-trail' : ''} group`}>
            <div className={cn(
                "relative p-6 rounded-[24px] transition-all duration-500 h-full",
                vistaPremium 
                    ? "bg-[#0A1122]/95 backdrop-blur-xl border border-white/5 hover:border-white/10" 
                    : "bg-white border border-gray-100 shadow-sm"
            )}>
                {/* Supreme Security Laser Scan */}
                <div className={`absolute inset-0 pointer-events-none z-10 ${vistaPremium ? 'block' : 'hidden'}`}>
                    <div className="w-full h-[1px] bg-cyan-400 absolute animate-laser-scan blur-[1px] opacity-30"></div>
                </div>

                <div className="flex items-start justify-between relative z-20">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-3 rounded-2xl transition-all duration-500",
                            vistaPremium 
                                ? "bg-white/5 group-hover:bg-cyan-500/10" 
                                : "bg-slate-50"
                        )}>
                            {Icon && <Icon size={24} className={cn(
                                "transition-all duration-500",
                                vistaPremium ? current.text : "text-gray-600"
                            )} />}
                        </div>
                        <div>
                            <p className={cn(
                                "text-[10px] font-black uppercase tracking-[0.2em]",
                                vistaPremium ? "text-white/40" : "text-gray-500"
                            )}>{title}</p>
                            <h3 className={cn(
                                "text-2xl font-black mt-1 number-font tracking-tight",
                                vistaPremium ? "text-white" : "text-gray-900"
                            )}>{value}</h3>
                        </div>
                    </div>

                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border",
                            trend.isUp 
                                ? (vistaPremium ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100')
                                : (vistaPremium ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-100')
                        )}>
                            {trend.isUp ? '↑' : '↓'} {trend.value}%
                        </div>
                    )}
                </div>

                {/* Data Progress Track */}
                <div className={cn(
                    "mt-6 h-1 w-full rounded-full overflow-hidden",
                    vistaPremium ? "bg-white/5" : "bg-gray-100"
                )}>
                    <div 
                        className={cn(
                            "h-full transition-all duration-1000",
                            vistaPremium ? "bg-gradient-to-r from-cyan-500 to-blue-500" : "bg-teal-500"
                        )}
                        style={{ width: '65%' }}
                    ></div>
                </div>
            </div>
        </div>
    )
}
