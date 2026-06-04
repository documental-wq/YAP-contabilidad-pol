import React from 'react';
import { ResponsiveContainer, RadialBarChart, RadialBar, Legend, Tooltip } from 'recharts';

export function RadialGaugeChart({ data, title }) {
    // Custom data format matching Recharts radial requirement
    // Example data: [{ name: 'Pagado', value: 75, fill: '#1A6FFF' }, { name: 'Mora', value: 25, fill: '#F43F5E' }]

    return (
        <div className="flex flex-col items-center justify-center w-full h-full relative">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#00D4FF]/20 blur-[60px] rounded-full animate-pulse-glow"></div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                    cx="50%"
                    cy="60%"
                    innerRadius="75%"
                    outerRadius="100%"
                    barSize={20}
                    data={data}
                    startAngle={210}
                    endAngle={-30}
                >
                    <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#1A6FFF" />
                            <stop offset="100%" stopColor="#00D4FF" />
                        </linearGradient>
                    </defs>
                    <RadialBar
                        minAngle={15}
                        background={{ fill: 'rgba(255,255,255,0.03)' }}
                        clockWise
                        dataKey="value"
                        cornerRadius={20}
                        fill="url(#gaugeGradient)"
                        style={{ filter: 'url(#glow)' }}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(10,13,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{ fill: 'transparent' }}
                    />
                </RadialBarChart>
            </ResponsiveContainer>

            <div className="absolute top-[65%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center group">
                <p className="text-[#94A3B8] text-[10px] uppercase tracking-[0.3em] font-extrabold mb-1">{title}</p>
                <div className="relative">
                    <p className="font-syne text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all duration-500 group-hover:scale-110">
                        {data[0]?.value}<span className="text-xl text-[#00D4FF] ml-0.5">%</span>
                    </p>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="h-[1px] w-4 bg-gradient-to-r from-transparent to-[#00D4FF]/50"></div>
                    <p className="text-[10px] text-[#00D4FF] font-bold tracking-widest uppercase flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] glow-cyan animate-pulse"></span>
                        Estado Operativo
                    </p>
                    <div className="h-[1px] w-4 bg-gradient-to-l from-transparent to-[#00D4FF]/50"></div>
                </div>
            </div>
        </div>
    );
}
