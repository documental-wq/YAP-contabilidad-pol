const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export const formatFechaLarga = (dateString) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`
}

export const formatFechaCorta = (dateString) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    return `${String(d.getDate()).padStart(2, '0')} ${MESES_CORTOS[d.getMonth()]} ${d.getFullYear()}`
}

export const formatQuincena = (dateString) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    const q = d.getDate() <= 15 ? 'Q1' : 'Q2'
    return `${q} ${MESES_CORTOS[d.getMonth()]} ${d.getFullYear()}`
}
