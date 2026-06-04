import Decimal from 'decimal.js'

// Configuramos Decimal.js para tener suficiente precisión y truncamiento adecuado.
// Usamos rounding MODE_HALF_UP típicamente usado en finanzas
Decimal.set({ precision: 20, rounding: 4 })

export const redondear2 = (n) => new Decimal(n).toDecimalPlaces(2).toNumber()
export const redondear4 = (n) => new Decimal(n).toDecimalPlaces(4).toNumber()
export const redondear6 = (n) => new Decimal(n).toDecimalPlaces(6).toNumber()

export function obtenerTasaQuincenal(tasa) {
    const v = new Decimal(tasa.valor_snapshot ?? tasa.valor_porcentaje)
    const tipo = tasa.tipo_calculo_snapshot ?? tasa.tipo_calculo

    switch (tipo) {
        case 'porcentaje_periodico':
        case 'porcentaje_simple':
            return redondear6(v)

        case 'porcentaje_mensual':
            return redondear6(v.dividedBy(2)) // Interés nominal mensual dividido en 2 quincenas

        case 'porcentaje_anual':
            return redondear6(v.dividedBy(24)) // 24 quincenas en un año

        case 'monto_fijo':
            return null // Usar valor_fijo directamente en pesos

        default:
            return redondear6(v)
    }
}

/**
 * Calcula la cuota periódica para amortización francesa (cuota fija)
 */
export function calcularCuotaFija(principal, tasaQuincenal, cuotas) {
    const p = new Decimal(principal)
    const tq = new Decimal(tasaQuincenal)
    const c = new Decimal(cuotas)

    if (tq.isZero()) return redondear2(p.dividedBy(c))

    // r = tasaQuincenal / 100
    const r = tq.dividedBy(100)

    // factor = (1 + r)^cuotas
    const factor = new Decimal(1).plus(r).pow(c)

    // p * (r * factor) / (factor - 1)
    const numerador = p.times(r.times(factor))
    const denominador = factor.minus(1)

    return redondear2(numerador.dividedBy(denominador))
}

export function calcularPrestamo({ montoOtorgado, numeroCuotas, tasasAsignadas, fechaPrimerPago }) {
    // Separar tasas por tipo
    const tasasPeriodicas = tasasAsignadas.filter(t => t.activa && !t.es_cargo_unico && !t.es_tasa_mora)
    const tasasUnicas = tasasAsignadas.filter(t => t.activa && t.es_cargo_unico)

    const mOtorgado = new Decimal(montoOtorgado)
    const nCuotas = parseInt(numeroCuotas)

    // Buscamos la tasa periódica de 'interés' para el cálculo francés
    const tasaInteresPura = tasasAsignadas.find(t => t.activa && !t.es_cargo_unico && (t.nombre.toLowerCase().includes('interés') || t.nombre.toLowerCase().includes('tasa')))
    const tQuincenalInteres = tasaInteresPura ? obtenerTasaQuincenal(tasaInteresPura) : 0

    const usaCuotaFija = tQuincenalInteres > 0
    const cuotaFijaBase = usaCuotaFija ? new Decimal(calcularCuotaFija(mOtorgado.toNumber(), tQuincenalInteres, nCuotas)) : new Decimal(0)

    const capitalConstante = mOtorgado.dividedBy(nCuotas)
    let saldoInicial = new Decimal(mOtorgado)
    const tablaCuotas = []

    for (let i = 1; i <= nCuotas; i++) {
        const fechaCuota = new Date(fechaPrimerPago)
        fechaCuota.setDate(fechaCuota.getDate() + (i - 1) * 15)

        // Si usamos Cuota Fija, el capital es: cuotaFijaBase - interesPuro
        let interesPuroParaAmortizar = new Decimal(0)
        if (usaCuotaFija) {
            // interesPuro = saldoInicial * (tQuincenalInteres / 100)
            const tasaDec = new Decimal(tQuincenalInteres).dividedBy(100)
            // AJUSTE: Redondear interesPuroParaAmortizar al instante
            interesPuroParaAmortizar = new Decimal(redondear2(saldoInicial.times(tasaDec).toNumber()))
        }

        // Capital de esta cuota
        let capitalEstaCuota = new Decimal(0)
        if (i === nCuotas) {
            capitalEstaCuota = saldoInicial
        } else if (usaCuotaFija) {
            // AJUSTE: cuotaFijaBase y interesPuroParaAmortizar ya tienen 2 decimales, por tanto, capitalEstaCuota también los tendrá.
            capitalEstaCuota = cuotaFijaBase.minus(interesPuroParaAmortizar)
        } else {
            // AJUSTE: Redondear el capital constante a 2 decimales
            capitalEstaCuota = new Decimal(redondear2(capitalConstante.toNumber()))
        }

        let interesesEstaCuota = new Decimal(0)
        const desglose = []

        for (const tasa of tasasPeriodicas) {
            const aplicacionBase = tasa.aplica_sobre_snapshot ?? tasa.aplica_sobre
            const base = aplicacionBase === 'saldo_pendiente' ? saldoInicial : mOtorgado

            let valor = new Decimal(0)
            const tipoCalc = tasa.tipo_calculo_snapshot ?? tasa.tipo_calculo
            if (tipoCalc === 'monto_fijo') {
                valor = new Decimal(tasa.valor_snapshot ?? tasa.valor_fijo ?? 0)
            } else {
                const tasaQ = obtenerTasaQuincenal(tasa)
                const tasaDec = new Decimal(tasaQ).dividedBy(100)
                valor = base.times(tasaDec)
            }

            // AJUSTE: Redondear el interés individual inmediatamente a 2 decimales
            const valorRedondeado = new Decimal(redondear2(valor.toNumber()))
            interesesEstaCuota = interesesEstaCuota.plus(valorRedondeado)

            desglose.push({
                nombre: tasa.nombre_snapshot ?? tasa.nombre,
                tipo: tipoCalc,
                base: base.toNumber(),
                tasaQ: obtenerTasaQuincenal(tasa),
                valor: valorRedondeado.toNumber(),
                esUnico: false
            })
        }

        // Cargos únicos solo en cuota 1
        let cargosUnicos = new Decimal(0)
        if (i === 1) {
            for (const cargo of tasasUnicas) {
                const v = new Decimal(cargo.valor_snapshot ?? cargo.valor_porcentaje)

                let valor = new Decimal(0)
                const tipoCalc = cargo.tipo_calculo_snapshot ?? cargo.tipo_calculo
                if (tipoCalc === 'monto_fijo') {
                    valor = new Decimal(cargo.valor_snapshot ?? cargo.valor_fijo ?? 0)
                } else {
                    const decV = v.dividedBy(100)
                    valor = mOtorgado.times(decV)
                }

                // AJUSTE: Redondear el cargo único inmediatamente a 2 decimales
                const valorRedondeado = new Decimal(redondear2(valor.toNumber()))
                cargosUnicos = cargosUnicos.plus(valorRedondeado)

                desglose.push({
                    nombre: cargo.nombre_snapshot ?? cargo.nombre,
                    base: mOtorgado.toNumber(),
                    tasaQ: v.toNumber(),
                    valor: valorRedondeado.toNumber(),
                    esUnico: true
                })
            }
        }

        // AJUSTE: Cuota Total es la suma exacta de los componentes ya redondeados a 2 decimales
        const cuotaTotal = capitalEstaCuota.plus(interesesEstaCuota).plus(cargosUnicos)
        
        // AJUSTE: El saldo final se reduce restando exactamente el capital amortizado redondeado
        const saldoFinal = saldoInicial.minus(capitalEstaCuota)

        // Asegurarse de que el saldo final no sea un número negativo minúsculo por redondeo
        const saldoFinalAjustado = saldoFinal.lessThan(0) && saldoFinal.greaterThan(-0.02) ? new Decimal(0) : saldoFinal

        tablaCuotas.push({
            numeroCuota: i,
            fechaPago: new Date(fechaCuota),
            saldoInicio: redondear2(saldoInicial.toNumber()),
            capitalAbonado: redondear2(capitalEstaCuota.toNumber()),
            interesesCobrados: redondear2(interesesEstaCuota.toNumber()),
            cargosUnicos: redondear2(cargosUnicos.toNumber()),
            cuotaTotal: redondear2(cuotaTotal.toNumber()),
            saldoFinal: redondear2(saldoFinalAjustado.toNumber()),
            desglose
        })

        saldoInicial = saldoFinalAjustado
    }

    if (Math.abs(saldoInicial.toNumber()) > 0.02) {
        throw new Error(`Error en cálculo de amortización: saldo final no es cero. Restante=${saldoInicial.toNumber()}`)
    }

    let sumCuotaTotal = new Decimal(0)
    let sumIntereses = new Decimal(0)
    let sumCargos = new Decimal(0)

    tablaCuotas.forEach(c => {
        sumCuotaTotal = sumCuotaTotal.plus(c.cuotaTotal)
        sumIntereses = sumIntereses.plus(c.interesesCobrados)
        sumCargos = sumCargos.plus(c.cargosUnicos)
    })

    const totalPagado = redondear2(sumCuotaTotal.toNumber())
    const totalIntereses = redondear2(sumIntereses.toNumber())
    const totalCargosUnicos = redondear2(sumCargos.toNumber())

    const mOtorgNum = mOtorgado.toNumber()
    const costoFinanciero = redondear2(sumCuotaTotal.minus(mOtorgado).toNumber())
    const tasaEfectiva = redondear4(new Decimal(costoFinanciero).dividedBy(mOtorgado).times(100).toNumber())

    const cuotaPrimera = tablaCuotas[0].cuotaTotal

    let sumSiguientes = new Decimal(0)
    if (nCuotas > 1) {
        tablaCuotas.slice(1).forEach(c => {
            sumSiguientes = sumSiguientes.plus(c.cuotaTotal)
        })
    }

    const cuotaEstandar = nCuotas > 1
        ? redondear2(sumSiguientes.dividedBy(nCuotas - 1).toNumber())
        : cuotaPrimera

    const cuotaUltima = tablaCuotas[tablaCuotas.length - 1].cuotaTotal

    // Formatear tabla de cuotas para compatibilidad JSON con Prisma
    const tablaParseable = tablaCuotas.map(c => ({
        ...c,
        fechaPago: c.fechaPago.toISOString()
    }))

    return {
        montoOtorgado: mOtorgNum,
        numeroCuotas: nCuotas,
        fechaUltimoPago: tablaCuotas[tablaCuotas.length - 1].fechaPago,
        cuotaPrimera,
        cuotaEstandar,
        cuotaUltima,
        totalCapital: mOtorgNum,
        totalIntereses,
        totalCargosUnicos,
        totalPagado,
        costoFinanciero,
        tasaEfectiva,
        tablaCuotas: tablaParseable // Para enviar por JSON o guardar
    }
}

/**
 * Valida que las tasas asignadas no excedan el límite de usura mensual regulatorio.
 * @param {Array} tasasAsignadas - Array de tasas asignadas
 * @returns {Object} - Resultado de la validación
 */
export function validarTasaUsura(tasasAsignadas) {
    if (!Array.isArray(tasasAsignadas)) return { excede: false }

    const tasasPeriodicas = tasasAsignadas.filter(t => t.activa && !t.es_cargo_unico && !t.es_tasa_mora)
    
    let tasaMensualTotal = new Decimal(0)
    for (const t of tasasPeriodicas) {
        const tQ = obtenerTasaQuincenal(t)
        if (tQ) {
            tasaMensualTotal = tasaMensualTotal.plus(new Decimal(tQ).times(2))
        }
    }
    
    const LIMITE_USURA_MENSUAL = new Decimal(3.5)
    
    if (tasaMensualTotal.greaterThan(LIMITE_USURA_MENSUAL)) {
        return {
            excede: true,
            tasaAcumulada: tasaMensualTotal.toNumber(),
            mensaje: `¡Alerta de Usura! La suma de tasas periódicas (${tasaMensualTotal.toFixed(2)}% mensual) supera el límite regulatorio permitido de ${LIMITE_USURA_MENSUAL}% mensual (~45% EA).`
        }
    }
    
    return { excede: false }
}

