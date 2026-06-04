import React from 'react';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from 'recharts';

export function RadarMetrics({ data }) {
    return (
        <div className="w-full h-full relative group">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }}
                        axisLine={false}
                    />
                    <PolarRadiusAxis
                        angle={30}
                        domain={[0, 'auto']}
                        tick={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(10,13,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                        itemStyle={{ color: '#00D4FF', fontWeight: 'bold' }}
                    />
                    <Radar
                        name="Préstamos"
                        dataKey="A"
                        stroke="#00D4FF"
                        strokeWidth={2}
                        fill="#00D4FF"
                        fillOpacity={0.2}
                        className="group-hover:fill-opacity-40 transition-all duration-300"
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
