const redondear2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100
const redondear4 = (n) => Math.round((n + Number.EPSILON) * 10000) / 10000
const redondear6 = (n) => Math.round((n + Number.EPSILON) * 1000000) / 1000000

export function obtenerSiguienteQuincena(fecha, fechaPrimerPago) {
    const nuevaFecha = new Date(fecha.getTime())
    const refFecha = fechaPrimerPago ? new Date(fechaPrimerPago) : new Date(fecha.getTime())
    const diaInicio = refFecha.getDate()
    const diaActual = nuevaFecha.getDate()
    
    // Si el día de inicio es el 15 o representa el fin de mes (28 o más)
    if (diaInicio === 15 || diaInicio >= 28) {
        if (diaActual === 15) {
            // Ir al último día del mismo mes.
            nuevaFecha.setDate(1)
            nuevaFecha.setMonth(nuevaFecha.getMonth() + 1)
            nuevaFecha.setDate(0)
        } else {
            // Ir al día 15 del siguiente mes.
            nuevaFecha.setDate(15)
            nuevaFecha.setMonth(nuevaFecha.getMonth() + 1)
        }
    } else if (diaInicio < 15) {
        const segundoDia = diaInicio + 15
        if (diaActual === diaInicio) {
            nuevaFecha.setDate(segundoDia)
        } else {
            nuevaFecha.setDate(diaInicio)
            nuevaFecha.setMonth(nuevaFecha.getMonth() + 1)
        }
    } else {
        // diaInicio > 15 pero menor que 28. Ejemplo: 25.
        const primerDia = diaInicio - 15
        if (diaActual === diaInicio) {
            nuevaFecha.setDate(primerDia)
            nuevaFecha.setMonth(nuevaFecha.getMonth() + 1)
        } else {
            nuevaFecha.setDate(diaInicio)
        }
    }
    return nuevaFecha
}

export function obtenerTasaQuincenal(tasa) {
    const tipo = tasa.tipo_calculo_snapshot ?? tasa.tipo_calculo
    let valorRaw = tasa.valor_snapshot
    if (valorRaw === undefined || valorRaw === null || String(valorRaw).trim() === '') {
        valorRaw = (tipo === 'monto_fijo') ? (tasa.valor_fijo ?? 0) : (tasa.valor_porcentaje ?? 0)
    }
    const vStr = String(valorRaw).replace(',', '.')
    const v = parseFloat(vStr) || 0

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

export function calcularPrestamoSimulador({ montoOtorgado, numeroCuotas, tasasAsignadas, fechaPrimerPago, metodoAmortizacion = 'frances', diferirCargos = true }) {
    const filterActiva = (t) => {
        if (!t.activa) return false
        if (t.es_interes_principal) return true
        const tipo = t.tipo_calculo_snapshot ?? t.tipo_calculo
        let valorRaw = t.valor_snapshot
        if (valorRaw === undefined || valorRaw === null || String(valorRaw).trim() === '') {
            valorRaw = (tipo === 'monto_fijo') ? (t.valor_fijo ?? 0) : (t.valor_porcentaje ?? 0)
        }
        const parsed = parseFloat(String(valorRaw).replace(',', '.'))
        const val = isNaN(parsed) ? 0 : parsed
        return val > 0
    }

    const tasasPeriodicas = tasasAsignadas.filter(t => filterActiva(t) && !t.es_cargo_unico && !t.es_tasa_mora)
    const tasasUnicas = tasasAsignadas.filter(t => filterActiva(t) && t.es_cargo_unico)

    const mOtorgadoStr = String(montoOtorgado ?? 0).replace(',', '.')
    const mOtorgado = parseFloat(mOtorgadoStr) || 0
    const nCuotas = parseInt(numeroCuotas) || 1
    if (mOtorgado <= 0 || nCuotas <= 0) return null

    // Buscamos la primera tasa periódica de 'interés' puro para el cálculo de amortización francesa si aplica
    const tasaInteresPura = tasasPeriodicas.find(t => t.es_interes_principal) || tasasPeriodicas.find(t => {
        const name = (t.nombre_snapshot ?? t.nombre ?? '').toLowerCase();
        return name.includes('interés') || 
               name.includes('interes') || 
               name.includes('tasa') || 
               name.includes('interest') || 
               name.includes('rate');
    }) || tasasPeriodicas.find(t => (t.tipo_calculo_snapshot ?? t.tipo_calculo) !== 'monto_fijo');

    // Sumamos todas las tasas periódicas que aplican sobre saldo_pendiente
    let tasaInteresTotal = 0
    for (const tasa of tasasPeriodicas) {
        const esPrincipal = tasaInteresPura && (tasa.id === tasaInteresPura.id || tasa.nombre === tasaInteresPura.nombre)
        const aplicaSobreSaldo = (tasa.aplica_sobre_snapshot ?? tasa.aplica_sobre) === 'saldo_pendiente'
        if (esPrincipal || aplicaSobreSaldo) {
            const tasaQ = obtenerTasaQuincenal(tasa)
            if (tasaQ) {
                tasaInteresTotal += tasaQ
            }
        }
    }

    const usaCuotaFija = metodoAmortizacion === 'frances' && tasaInteresTotal > 0
    
    // Si usa cuota fija, calculamos el valor de cuota total constante (redondeado a entero)
    let cuotaTotalConstante = 0
    if (usaCuotaFija) {
        // 1. PMT base para capital + intereses/seguros sobre saldo pendiente
        const pmtBase = calcularCuotaFija(mOtorgado, tasaInteresTotal, nCuotas)
        
        // 2. Sumamos cargos periódicos flats
        let cargosPeriodicosFlats = 0
        for (const tasa of tasasPeriodicas) {
            const esPrincipal = tasaInteresPura && (tasa.id === tasaInteresPura.id || tasa.nombre === tasaInteresPura.nombre)
            const aplicaSobreSaldo = (tasa.aplica_sobre_snapshot ?? tasa.aplica_sobre) === 'saldo_pendiente'
            if (!esPrincipal && !aplicaSobreSaldo) {
                const tipoCalc = tasa.tipo_calculo_snapshot ?? tasa.tipo_calculo
                if (tipoCalc === 'monto_fijo') {
                    const vFijoStr = String(tasa.valor_snapshot ?? tasa.valor_fijo ?? 0)
                    cargosPeriodicosFlats += parseFloat(vFijoStr.replace(',', '.'))
                } else {
                    const tasaQ = obtenerTasaQuincenal(tasa)
                    cargosPeriodicosFlats += mOtorgado * (tasaQ / 100)
                }
            }
        }

        // 3. Sumamos cargos únicos diferidos
        let cargosUnicosDiferidos = 0
        if (diferirCargos) {
            let totalCargosUnicos = 0
            for (const cargo of tasasUnicas) {
                const tipoCalc = cargo.tipo_calculo_snapshot ?? cargo.tipo_calculo
                let valorRaw = cargo.valor_snapshot
                if (valorRaw === undefined || valorRaw === null || String(valorRaw).trim() === '') {
                    valorRaw = (tipoCalc === 'monto_fijo') ? (cargo.valor_fijo ?? 0) : (cargo.valor_porcentaje ?? 0)
                }
                const v = parseFloat(String(valorRaw).replace(',', '.')) || 0
                if (tipoCalc === 'monto_fijo') {
                    totalCargosUnicos += v
                } else {
                    totalCargosUnicos += mOtorgado * (v / 100)
                }
            }
            cargosUnicosDiferidos = totalCargosUnicos / nCuotas
        }

        const cuotaTotalProyectada = pmtBase + cargosPeriodicosFlats + cargosUnicosDiferidos
        cuotaTotalConstante = Math.round(cuotaTotalProyectada)
    }

    let saldoInicial = mOtorgado
    const tablaCuotas = []
    let totalCargosUnicosCalculados = 0

    for (const cargo of tasasUnicas) {
        const tipoCalc = cargo.tipo_calculo_snapshot ?? cargo.tipo_calculo
        let valorRaw = cargo.valor_snapshot
        if (valorRaw === undefined || valorRaw === null || String(valorRaw).trim() === '') {
            valorRaw = (tipoCalc === 'monto_fijo') ? (cargo.valor_fijo ?? 0) : (cargo.valor_porcentaje ?? 0)
        }
        const v = parseFloat(String(valorRaw).replace(',', '.')) || 0
        if (tipoCalc === 'monto_fijo') {
            totalCargosUnicosCalculados += v
        } else {
            totalCargosUnicosCalculados += mOtorgado * (v / 100)
        }
    }

    const fPago = fechaPrimerPago ? new Date(fechaPrimerPago) : new Date()
    let fechaCuota = new Date(fPago)

    for (let i = 1; i <= nCuotas; i++) {
        if (i > 1) {
            fechaCuota = obtenerSiguienteQuincena(fechaCuota, fPago)
        }

        let interesesEstaCuota = 0
        const desglose = []

        for (const tasa of tasasPeriodicas) {
            const esPrincipal = tasaInteresPura && (tasa.id === tasaInteresPura.id || tasa.nombre === tasaInteresPura.nombre)
            const aplicaSobreSaldo = (tasa.aplica_sobre_snapshot ?? tasa.aplica_sobre) === 'saldo_pendiente'

            let base = mOtorgado
            let valor = 0
            const tipoCalc = tasa.tipo_calculo_snapshot ?? tasa.tipo_calculo
            if (tipoCalc === 'monto_fijo') {
                const vFijoStr = String(tasa.valor_snapshot ?? tasa.valor_fijo ?? 0)
                valor = parseFloat(vFijoStr.replace(',', '.')) || 0
                base = 0
            } else {
                const tasaQ = obtenerTasaQuincenal(tasa)
                const tasaDec = tasaQ / 100
                if (usaCuotaFija && (esPrincipal || aplicaSobreSaldo)) {
                    base = saldoInicial
                } else {
                    base = aplicaSobreSaldo ? saldoInicial : mOtorgado
                }
                valor = base * tasaDec
            }

            const valorRedondeado = redondear2(valor)
            interesesEstaCuota = redondear2(interesesEstaCuota + valorRedondeado)

            desglose.push({
                nombre: tasa.nombre_snapshot ?? tasa.nombre,
                tipo: tipoCalc,
                base,
                tasaQ: obtenerTasaQuincenal(tasa),
                valor: valorRedondeado,
                esUnico: false
            })
        }

        let cargosUnicos = 0
        for (const cargo of tasasUnicas) {
            const tipoCalc = cargo.tipo_calculo_snapshot ?? cargo.tipo_calculo
            let valorRaw = cargo.valor_snapshot
            if (valorRaw === undefined || valorRaw === null || String(valorRaw).trim() === '') {
                valorRaw = (tipoCalc === 'monto_fijo') ? (cargo.valor_fijo ?? 0) : (cargo.valor_porcentaje ?? 0)
            }
            const v = parseFloat(String(valorRaw).replace(',', '.')) || 0

            let valorTotalCargo = 0
            if (tipoCalc === 'monto_fijo') {
                valorTotalCargo = v
            } else {
                valorTotalCargo = mOtorgado * (v / 100)
            }

            let valorParaEstaCuota = 0
            if (diferirCargos) {
                if (i === nCuotas) {
                    const yaCobrado = redondear2(valorTotalCargo / nCuotas) * (nCuotas - 1)
                    valorParaEstaCuota = valorTotalCargo - yaCobrado
                } else {
                    valorParaEstaCuota = redondear2(valorTotalCargo / nCuotas)
                }
            } else {
                if (i === 1) {
                    valorParaEstaCuota = valorTotalCargo
                }
            }

            const valorRedondeado = redondear2(valorParaEstaCuota)
            cargosUnicos = redondear2(cargosUnicos + valorRedondeado)

            desglose.push({
                nombre: cargo.nombre_snapshot ?? cargo.nombre,
                base: mOtorgado,
                tasaQ: v,
                valor: valorRedondeado,
                esUnico: true
            })
        }

        let cuotaTotal = 0
        let capitalEstaCuota = 0

        if (i === nCuotas) {
            capitalEstaCuota = saldoInicial
            if (usaCuotaFija) {
                // Cuota fija: siempre igual a cuotaTotalConstante.
                // El ajuste de redondeo se absorbe únicamente en el interés.
                cuotaTotal = cuotaTotalConstante
            } else {
                const preCuotaTotal = capitalEstaCuota + interesesEstaCuota + cargosUnicos
                cuotaTotal = Math.round(preCuotaTotal)
            }
            // Ajustamos el interés para absorber la diferencia de redondeo
            interesesEstaCuota = redondear2(cuotaTotal - capitalEstaCuota - cargosUnicos)
        } else if (usaCuotaFija) {
            let cuotaTotalBase = cuotaTotalConstante
            if (!diferirCargos && i === 1) {
                cuotaTotalBase += totalCargosUnicosCalculados
            }
            cuotaTotal = cuotaTotalBase
            capitalEstaCuota = redondear2(cuotaTotal - interesesEstaCuota - cargosUnicos)
        } else {
            capitalEstaCuota = redondear2(mOtorgado / nCuotas)
            cuotaTotal = redondear2(capitalEstaCuota + interesesEstaCuota + cargosUnicos)
        }

        const saldoFinal = redondear2(saldoInicial - capitalEstaCuota)
        const saldoFinalAjustado = saldoFinal < 0 && saldoFinal > -0.02 ? 0 : saldoFinal

        tablaCuotas.push({
            numeroCuota: i,
            fechaPago: new Date(fechaCuota),
            saldoInicio: redondear2(saldoInicial),
            capitalAbonado: capitalEstaCuota,
            interesesCobrados: interesesEstaCuota,
            cargosUnicos,
            cuotaTotal,
            saldoFinal: redondear2(saldoFinalAjustado),
            desglose
        })

        saldoInicial = saldoFinalAjustado
    }

    const totalPagado = redondear2(tablaCuotas.reduce((s, c) => s + c.cuotaTotal, 0))
    const totalIntereses = redondear2(tablaCuotas.reduce((s, c) => s + c.interesesCobrados, 0))
    const totalCargosUnicos = redondear2(tablaCuotas.reduce((s, c) => s + c.cargosUnicos, 0))
    const costoFinanciero = redondear2(totalPagado - mOtorgado)
    const tasaEfectiva = isNaN(costoFinanciero / mOtorgado) ? 0 : redondear4((costoFinanciero / mOtorgado) * 100)

    // cuotaEstandar: en método francés siempre es cuotaTotalConstante (entero exacto por cuota).
    // No se promedia para evitar decimales por diferencias de redondeo en la última cuota.
    const cuotaEstandar = usaCuotaFija
        ? cuotaTotalConstante          // francés: valor fijo real
        : (tablaCuotas[0]?.cuotaTotal || 0)  // lineal: primera cuota como referencia

    const cuotaPrimera = tablaCuotas[0]?.cuotaTotal || 0
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
