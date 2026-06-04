export const formatCOP = (n) => {
    if (n === null || n === undefined) return '$0 COP'
    return '$' + Number(n).toLocaleString('es-CO') + ' COP'
}

export const formatCOPCorto = (n) => {
    if (n === null || n === undefined) return '$0'
    return '$' + Number(n).toLocaleString('es-CO')
}

export const formatCedula = (n) => {
    if (!n) return ''
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export const formatPorcentaje = (n, d = 4) => {
    if (n === null || n === undefined) return '0%'
    return `${Number(n).toFixed(d)}%`
}
