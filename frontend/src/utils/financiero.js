const redondear2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100
const redondear4 = (n) => Math.round((n + Number.EPSILON) * 10000) / 10000
const redondear6 = (n) => Math.round((n + Number.EPSILON) * 1000000) / 1000000

export function obtenerTasaQuincenal(tasa) {
    const v = parseFloat(tasa.valor_snapshot ?? tasa.valor_porcentaje)
    const tipo = tasa.tipo_calculo_snapshot ?? tasa.tipo_calculo

    switch (tipo) {
        case 'porcentaje_periodico':
        case 'porcentaje_simple':
            return redondear6(v)

        case 'porcentaje_mensual':
            // Muchos prestamistas usan interés simple (nominal) para facilitar el cálculo
            return redondear6(v / 2)

        case 'porcentaje_anual':
            return redondear6(v / 24) // 24 quincenas en un año

        case 'monto_fijo':
            return null

        default:
            return redondear6(v)
    }
}

/**
 * Calcula la cuota mensual para amortización francesa (cuota fija)
 * PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calcularCuotaFija(principal, tasaQuincenal, cuotas) {
    if (tasaQuincenal === 0) return redondear2(principal / cuotas)
    const r = tasaQuincenal / 100
    const factor = Math.pow(1 + r, cuotas)
    return redondear2(principal * (r * factor) / (factor - 1))
}

export function calcularPrestamoSimulador({ montoOtorgado, numeroCuotas, tasasAsignadas, fechaPrimerPago }) {
    const tasasPeriodicas = tasasAsignadas.filter(t => t.activa && !t.es_cargo_unico && !t.es_tasa_mora)
    const tasasUnicas = tasasAsignadas.filter(t => t.activa && t.es_cargo_unico)

    const mOtorgado = parseFloat(montoOtorgado) || 0
    const nCuotas = parseInt(numeroCuotas) || 1
    if (mOtorgado <= 0 || nCuotas <= 0) return null

    // Buscamos la primera tasa periódica de 'interés' puro para el cálculo de amortización francesa si aplica
    const tasaInteresPura = tasasPeriodicas.find(t => t.nombre.toLowerCase().includes('interés') || t.nombre.toLowerCase().includes('tasa'))
    const tQuincenalInteres = tasaInteresPura ? obtenerTasaQuincenal(tasaInteresPura) : 0

    // Decidimos el método (por defecto ahora usaremos Cuota Fija si hay una tasa de interés identificable)
    const usaCuotaFija = tQuincenalInteres > 0
    const cuotaFijaBase = usaCuotaFija ? calcularCuotaFija(mOtorgado, tQuincenalInteres, nCuotas) : 0

    const capitalConstante = redondear2(mOtorgado / nCuotas)
    let saldoInicial = mOtorgado
    const tablaCuotas = []

    const fPago = fechaPrimerPago ? new Date(fechaPrimerPago) : new Date()

    for (let i = 1; i <= nCuotas; i++) {
        const fechaCuota = new Date(fPago)
        fechaCuota.setDate(fechaCuota.getDate() + (i - 1) * 15)


        let interesesEstaCuota = 0
        const desglose = []

        for (const tasa of tasasPeriodicas) {
            const aplicacionBase = tasa.aplica_sobre_snapshot ?? tasa.aplica_sobre
            const base = aplicacionBase === 'saldo_pendiente' ? saldoInicial : mOtorgado

            let valor = 0
            if ((tasa.tipo_calculo_snapshot ?? tasa.tipo_calculo) === 'monto_fijo') {
                valor = redondear2(parseFloat(tasa.valor_snapshot ?? tasa.valor_fijo ?? 0))
            } else {
                const tasaQ = obtenerTasaQuincenal(tasa)
                valor = redondear2(base * (tasaQ / 100))
            }

            // Si es amortización francesa, el 'interés' ya está incluido en el cálculo de la cuota fija base
            // pero lo calculamos aquí para el desglose
            interesesEstaCuota = redondear2(interesesEstaCuota + valor)
            desglose.push({
                nombre: tasa.nombre_snapshot ?? tasa.nombre,
                tipo: tasa.tipo_calculo_snapshot ?? tasa.tipo_calculo,
                base,
                tasaQ: obtenerTasaQuincenal(tasa),
                valor,
                esUnico: false
            })
        }

        // Si usamos Cuota Fija, el capital de esta cuota es: cuotaFijaBase - interesPuro
        // de lo contrario usamos capital constante
        let interesPuroParaAmortizar = 0
        if (usaCuotaFija) {
            interesPuroParaAmortizar = redondear2(saldoInicial * (tQuincenalInteres / 100))
        }

        const capitalEstaCuota = (i === nCuotas)
            ? redondear2(saldoInicial)
            : (usaCuotaFija ? redondear2(cuotaFijaBase - interesPuroParaAmortizar) : capitalConstante)

        let cargosUnicos = 0
        if (i === 1) {
            for (const cargo of tasasUnicas) {
                const v = parseFloat(cargo.valor_snapshot ?? cargo.valor_porcentaje)

                let valor = 0
                if ((cargo.tipo_calculo_snapshot ?? cargo.tipo_calculo) === 'monto_fijo') {
                    valor = redondear2(parseFloat(cargo.valor_snapshot ?? cargo.valor_fijo ?? 0))
                } else {
                    valor = redondear2(mOtorgado * (v / 100))
                }

                cargosUnicos = redondear2(cargosUnicos + valor)
                desglose.push({
                    nombre: cargo.nombre_snapshot ?? cargo.nombre,
                    base: mOtorgado,
                    tasaQ: v,
                    valor,
                    esUnico: true
                })
            }
        }

        const cuotaTotal = redondear2(capitalEstaCuota + interesesEstaCuota + cargosUnicos)
        const saldoFinal = redondear2(saldoInicial - capitalEstaCuota)

        tablaCuotas.push({
            numeroCuota: i,
            fechaPago: new Date(fechaCuota),
            saldoInicio: redondear2(saldoInicial),
            capitalAbonado: capitalEstaCuota,
            interesesCobrados: interesesEstaCuota,
            cargosUnicos,
            cuotaTotal,
            saldoFinal,
            desglose
        })

        saldoInicial = saldoFinal
    }

    const totalPagado = redondear2(tablaCuotas.reduce((s, c) => s + c.cuotaTotal, 0))
    const totalIntereses = redondear2(tablaCuotas.reduce((s, c) => s + c.interesesCobrados, 0))
    const totalCargosUnicos = redondear2(tablaCuotas.reduce((s, c) => s + c.cargosUnicos, 0))
    const costoFinanciero = redondear2(totalPagado - mOtorgado)
    const tasaEfectiva = isNaN(costoFinanciero / mOtorgado) ? 0 : redondear4((costoFinanciero / mOtorgado) * 100)

    const cuotaPrimera = tablaCuotas[0]?.cuotaTotal || 0
    const cuotaEstandar = tablaCuotas.length > 1
        ? redondear2(tablaCuotas.slice(1).reduce((s, c) => s + c.cuotaTotal, 0) / (nCuotas - 1))
        : cuotaPrimera
    const cuotaUltima = tablaCuotas[tablaCuotas.length - 1]?.cuotaTotal || 0

    return {
        montoOtorgado: mOtorgado,
        numeroCuotas: nCuotas,
        fechaUltimoPago: tablaCuotas[tablaCuotas.length - 1]?.fechaPago,
        cuotaPrimera,
        cuotaEstandar,
        cuotaUltima,
        totalCapital: mOtorgado,
        totalIntereses,
        totalCargosUnicos,
        totalPagado,
        costoFinanciero,
        tasaEfectiva,
        tablaCuotas
    }
}

export function validarTasaUsura(tasasAsignadas) {
    const tasasPeriodicas = tasasAsignadas.filter(t => t.activa && !t.es_cargo_unico && !t.es_tasa_mora)
    
    let tasaMensualTotal = 0
    for (const t of tasasPeriodicas) {
        const tQ = obtenerTasaQuincenal(t)
        if (tQ) {
            tasaMensualTotal += tQ * 2
        }
    }
    
    const LIMITE_USURA_MENSUAL = 3.5
    
    if (tasaMensualTotal > LIMITE_USURA_MENSUAL) {
        return {
            excede: true,
            tasaAcumulada: tasaMensualTotal,
            mensaje: `¡Alerta de Usura! La suma de tasas periódicas (${tasaMensualTotal.toFixed(2)}% mensual) supera el límite regulatorio permitido de ${LIMITE_USURA_MENSUAL}% mensual (~45% EA).`
        }
    }
    
    return { excede: false }
}
