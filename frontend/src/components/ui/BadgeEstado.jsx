import React from 'react'

export function BadgeEstado({ estado }) {
    const configs = {
        'activo': { bg: 'bg-[#10B981]/10', text: 'text-[#10B981]', border: 'border-[#10B981]/40', label: 'Activo' },
        'en_mora': { bg: 'bg-[#F43F5E]/10', text: 'text-[#F43F5E]', border: 'border-[#F43F5E]/40', label: 'En Mora' },
        'pendiente_aprobacion': { bg: 'bg-[#FFB020]/10', text: 'text-[#FFB020]', border: 'border-[#FFB020]/40', label: 'Pendiente' },
        'cancelado': { bg: 'bg-[var(--texto-3)]/10', text: 'text-[var(--texto-2)]', border: 'border-[var(--texto-3)]/40', label: 'Cancelado/Pagado' },

        // Cuotas
        'pendiente': { bg: 'bg-[#FFB020]/10', text: 'text-[#FFB020]', border: 'border-[#FFB020]/40', label: 'Pendiente' },
        'pagada': { bg: 'bg-[#10B981]/10', text: 'text-[#10B981]', border: 'border-[#10B981]/40', label: 'Pagada' },
        'vencida': { bg: 'bg-[#F43F5E]/10', text: 'text-[#F43F5E]', border: 'border-[#F43F5E]/40', label: 'Vencida' },
        'anulada': { bg: 'bg-[var(--texto-3)]/10', text: 'text-[var(--texto-2)]', border: 'border-[var(--texto-3)]/40', label: 'Anulada' },
    }

    const cleanState = estado?.toLowerCase() || 'pendiente'
    const def = configs[cleanState] || configs['pendiente']

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border backdrop-blur-md ${def.bg} ${def.text} ${def.border} shadow-sm`}>
            {def.label}
        </span>
    )
}
