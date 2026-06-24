import Decimal from 'decimal.js'
import { prisma } from '../lib/prisma.js'

// Configuramos Decimal.js para tener suficiente precisión y truncamiento adecuado.
// Usamos rounding MODE_HALF_UP típicamente usado en finanzas
Decimal.set({ precision: 20, rounding: 4 })

export const redondear2 = (n) => new Decimal(n).toDecimalPlaces(2).toNumber()
export const redondear4 = (n) => new Decimal(n).toDecimalPlaces(4).toNumber()
export const redondear6 = (n) => new Decimal(n).toDecimalPlaces(6).toNumber()

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
    const parsed = parseFloat(vStr)
    const v = new Decimal(isNaN(parsed) ? 0 : parsed)

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

export function calcularPrestamo({ montoOtorgado, numeroCuotas, tasasAsignadas, fechaPrimerPago, metodoAmortizacion = 'frances', diferirCargos = false }) {
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

    // Separar tasas por tipo
    const tasasPeriodicas = tasasAsignadas.filter(t => filterActiva(t) && !t.es_cargo_unico && !t.es_tasa_mora)
    const tasasUnicas = tasasAsignadas.filter(t => filterActiva(t) && t.es_cargo_unico)

    const mOtorgadoStr = String(montoOtorgado ?? 0).replace(',', '.')
    const mOtorgado = new Decimal(parseFloat(mOtorgadoStr))
    const nCuotas = parseInt(numeroCuotas)

    // Buscamos la tasa periódica de 'interés' para el cálculo francés
    const tasaInteresPura = tasasPeriodicas.find(t => t.es_interes_principal) || tasasPeriodicas.find(t => {
        const name = (t.nombre_snapshot ?? t.nombre ?? '').toLowerCase();
        return name.includes('interés') || 
               name.includes('interes') || 
               name.includes('tasa') || 
               name.includes('interest') || 
               name.includes('rate');
    }) || tasasPeriodicas.find(t => (t.tipo_calculo_snapshot ?? t.tipo_calculo) !== 'monto_fijo');

    // Sumamos todas las tasas periódicas que aplican sobre saldo_pendiente
    let tasaInteresTotal = new Decimal(0)
    for (const tasa of tasasPeriodicas) {
        const esPrincipal = tasaInteresPura && (tasa.id === tasaInteresPura.id || tasa.nombre === tasaInteresPura.nombre)
        const aplicaSobreSaldo = (tasa.aplica_sobre_snapshot ?? tasa.aplica_sobre) === 'saldo_pendiente'
        if (esPrincipal || aplicaSobreSaldo) {
            const tasaQ = obtenerTasaQuincenal(tasa)
            if (tasaQ) {
                tasaInteresTotal = tasaInteresTotal.plus(new Decimal(tasaQ))
            }
        }
    }

    const usaCuotaFija = metodoAmortizacion === 'frances' && tasaInteresTotal.greaterThan(0)
    
    // Si usa cuota fija, calculamos el valor de cuota total constante (redondeado a entero)
    let cuotaTotalConstante = 0
    if (usaCuotaFija) {
        // 1. PMT base para capital + intereses/seguros sobre saldo pendiente
        const pmtBase = calcularCuotaFija(mOtorgado.toNumber(), tasaInteresTotal.toNumber(), nCuotas)
        
        // 2. Sumamos cargos periódicos flats
        let cargosPeriodicosFlats = new Decimal(0)
        for (const tasa of tasasPeriodicas) {
            const esPrincipal = tasaInteresPura && (tasa.id === tasaInteresPura.id || tasa.nombre === tasaInteresPura.nombre)
            const aplicaSobreSaldo = (tasa.aplica_sobre_snapshot ?? tasa.aplica_sobre) === 'saldo_pendiente'
            if (!esPrincipal && !aplicaSobreSaldo) {
                const tipoCalc = tasa.tipo_calculo_snapshot ?? tasa.tipo_calculo
                if (tipoCalc === 'monto_fijo') {
                    const vFijoStr = String(tasa.valor_snapshot ?? tasa.valor_fijo ?? 0)
                    cargosPeriodicosFlats = cargosPeriodicosFlats.plus(new Decimal(parseFloat(vFijoStr.replace(',', '.'))))
                } else {
                    const tasaQ = obtenerTasaQuincenal(tasa)
                    cargosPeriodicosFlats = cargosPeriodicosFlats.plus(mOtorgado.times(new Decimal(tasaQ).dividedBy(100)))
                }
            }
        }

        // 3. Sumamos cargos únicos diferidos
        let cargosUnicosDiferidos = new Decimal(0)
        if (diferirCargos) {
            let totalCargosUnicos = new Decimal(0)
            for (const cargo of tasasUnicas) {
                const tipoCalc = cargo.tipo_calculo_snapshot ?? cargo.tipo_calculo
                let valorRaw = cargo.valor_snapshot
                if (valorRaw === undefined || valorRaw === null || String(valorRaw).trim() === '') {
                    valorRaw = (tipoCalc === 'monto_fijo') ? (cargo.valor_fijo ?? 0) : (cargo.valor_porcentaje ?? 0)
                }
                const v = new Decimal(parseFloat(String(valorRaw).replace(',', '.')))
                if (tipoCalc === 'monto_fijo') {
                    totalCargosUnicos = totalCargosUnicos.plus(v)
                } else {
                    totalCargosUnicos = totalCargosUnicos.plus(mOtorgado.times(v.dividedBy(100)))
                }
            }
            cargosUnicosDiferidos = totalCargosUnicos.dividedBy(nCuotas)
        }

        const cuotaTotalProyectada = new Decimal(pmtBase).plus(cargosPeriodicosFlats).plus(cargosUnicosDiferidos)
        cuotaTotalConstante = Math.round(cuotaTotalProyectada.toNumber())
    }

    let saldoInicial = new Decimal(mOtorgado)
    const tablaCuotas = []
    let totalCargosUnicosCalculados = new Decimal(0)

    for (const cargo of tasasUnicas) {
        const tipoCalc = cargo.tipo_calculo_snapshot ?? cargo.tipo_calculo
        let valorRaw = cargo.valor_snapshot
        if (valorRaw === undefined || valorRaw === null || String(valorRaw).trim() === '') {
            valorRaw = (tipoCalc === 'monto_fijo') ? (cargo.valor_fijo ?? 0) : (cargo.valor_porcentaje ?? 0)
        }
        const v = new Decimal(parseFloat(String(valorRaw).replace(',', '.')))
        if (tipoCalc === 'monto_fijo') {
            totalCargosUnicosCalculados = totalCargosUnicosCalculados.plus(v)
        } else {
            totalCargosUnicosCalculados = totalCargosUnicosCalculados.plus(mOtorgado.times(v.dividedBy(100)))
        }
    }

    let fechaCuota = new Date(fechaPrimerPago)
    for (let i = 1; i <= nCuotas; i++) {
        if (i > 1) {
            fechaCuota = obtenerSiguienteQuincena(fechaCuota, fechaPrimerPago)
        }

        let interesesEstaCuota = new Decimal(0)
        const desglose = []

        for (const tasa of tasasPeriodicas) {
            const esPrincipal = tasaInteresPura && (tasa.id === tasaInteresPura.id || tasa.nombre === tasaInteresPura.nombre)
            const aplicaSobreSaldo = (tasa.aplica_sobre_snapshot ?? tasa.aplica_sobre) === 'saldo_pendiente'

            let base = mOtorgado
            let valor = new Decimal(0)
            const tipoCalc = tasa.tipo_calculo_snapshot ?? tasa.tipo_calculo
            if (tipoCalc === 'monto_fijo') {
                const vFijoStr = String(tasa.valor_snapshot ?? tasa.valor_fijo ?? 0)
                valor = new Decimal(parseFloat(vFijoStr.replace(',', '.')))
                base = new Decimal(0)
            } else {
                const tasaQ = obtenerTasaQuincenal(tasa)
                const tasaDec = new Decimal(tasaQ).dividedBy(100)
                if (usaCuotaFija && (esPrincipal || aplicaSobreSaldo)) {
                    base = saldoInicial
                } else {
                    base = aplicaSobreSaldo ? saldoInicial : mOtorgado
                }
                valor = base.times(tasaDec)
            }

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

        let cargosUnicos = new Decimal(0)
        for (const cargo of tasasUnicas) {
            const tipoCalc = cargo.tipo_calculo_snapshot ?? cargo.tipo_calculo
            let valorRaw = cargo.valor_snapshot
            if (valorRaw === undefined || valorRaw === null || String(valorRaw).trim() === '') {
                valorRaw = (tipoCalc === 'monto_fijo') ? (cargo.valor_fijo ?? 0) : (cargo.valor_porcentaje ?? 0)
            }
            const v = new Decimal(parseFloat(String(valorRaw).replace(',', '.')))

            let valorTotalCargo = new Decimal(0)
            if (tipoCalc === 'monto_fijo') {
                valorTotalCargo = v
            } else {
                valorTotalCargo = mOtorgado.times(v.dividedBy(100))
            }

            let valorParaEstaCuota = new Decimal(0)
            if (diferirCargos) {
                if (i === nCuotas) {
                    const yaCobrado = new Decimal(redondear2(valorTotalCargo.dividedBy(nCuotas).toNumber())).times(nCuotas - 1)
                    valorParaEstaCuota = valorTotalCargo.minus(yaCobrado)
                } else {
                    valorParaEstaCuota = new Decimal(redondear2(valorTotalCargo.dividedBy(nCuotas).toNumber()))
                }
            } else {
                if (i === 1) {
                    valorParaEstaCuota = valorTotalCargo
                }
            }

            const valorRedondeado = new Decimal(redondear2(valorParaEstaCuota.toNumber()))
            cargosUnicos = cargosUnicos.plus(valorRedondeado)

            desglose.push({
                nombre: cargo.nombre_snapshot ?? cargo.nombre,
                base: mOtorgado.toNumber(),
                tasaQ: v.toNumber(),
                valor: valorRedondeado.toNumber(),
                esUnico: true
            })
        }

        let cuotaTotal = new Decimal(0)
        let capitalEstaCuota = new Decimal(0)

        if (i === nCuotas) {
            capitalEstaCuota = saldoInicial
            if (usaCuotaFija) {
                // Cuota fija: siempre igual a cuotaTotalConstante.
                // El ajuste de redondeo se absorbe únicamente en el interés.
                cuotaTotal = new Decimal(cuotaTotalConstante)
            } else {
                const preCuotaTotal = capitalEstaCuota.plus(interesesEstaCuota).plus(cargosUnicos)
                cuotaTotal = new Decimal(Math.round(preCuotaTotal.toNumber()))
            }
            // Ajustamos el interés para absorber la diferencia de redondeo y que la suma sea perfecta
            interesesEstaCuota = cuotaTotal.minus(capitalEstaCuota).minus(cargosUnicos)
        } else if (usaCuotaFija) {
            let cuotaTotalBase = cuotaTotalConstante
            if (!diferirCargos && i === 1) {
                cuotaTotalBase += totalCargosUnicosCalculados.toNumber()
            }
            cuotaTotal = new Decimal(cuotaTotalBase)
            capitalEstaCuota = cuotaTotal.minus(interesesEstaCuota).minus(cargosUnicos)
        } else {
            capitalEstaCuota = new Decimal(redondear2(mOtorgado.dividedBy(nCuotas).toNumber()))
            cuotaTotal = capitalEstaCuota.plus(interesesEstaCuota).plus(cargosUnicos)
        }

        const saldoFinal = saldoInicial.minus(capitalEstaCuota)
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

    // cuotaEstandar:
    //   Francés: siempre cuotaTotalConstante (entero fijo, sin decimales por redondeo).
    //   Lineal:  promedio de cuotas 2..N (cuota "típica" de pagos regulares, excluyendo la primera
    //            que puede incluir cargos únicos no diferidos).
    let cuotaEstandar
    if (usaCuotaFija) {
        cuotaEstandar = cuotaTotalConstante
    } else if (nCuotas > 1) {
        let sumSiguientes = new Decimal(0)
        tablaCuotas.slice(1).forEach(c => { sumSiguientes = sumSiguientes.plus(c.cuotaTotal) })
        cuotaEstandar = redondear2(sumSiguientes.dividedBy(nCuotas - 1).toNumber())
    } else {
        cuotaEstandar = cuotaPrimera
    }

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
export async function validarTasaUsura(tasasAsignadas) {
    if (!Array.isArray(tasasAsignadas)) return { excede: false }

    const tasasPeriodicas = tasasAsignadas.filter(t => t.activa && !t.es_cargo_unico && !t.es_tasa_mora)
    
    let tasaMensualTotal = new Decimal(0)
    for (const t of tasasPeriodicas) {
        const tQ = obtenerTasaQuincenal(t)
        if (tQ) {
            tasaMensualTotal = tasaMensualTotal.plus(new Decimal(tQ).times(2))
        }
    }
    
    let limiteUsuraVal = 3.5
    try {
        const configRecord = await prisma.configuracion.findUnique({
            where: { clave: 'LIMITE_USURA_MENSUAL' }
        })
        if (configRecord && configRecord.valor) {
            const parsed = parseFloat(configRecord.valor)
            if (!isNaN(parsed)) {
                limiteUsuraVal = parsed
            }
        }
    } catch (error) {
        console.error('[validarTasaUsura] Error al obtener LIMITE_USURA_MENSUAL de la base de datos:', error)
    }

    const LIMITE_USURA_MENSUAL = new Decimal(limiteUsuraVal)
    
    if (tasaMensualTotal.greaterThan(LIMITE_USURA_MENSUAL)) {
        return {
            excede: true,
            tasaAcumulada: tasaMensualTotal.toNumber(),
            mensaje: `¡Alerta de Usura! La suma de tasas periódicas (${tasaMensualTotal.toFixed(2)}% mensual) supera el límite regulatorio permitido de ${LIMITE_USURA_MENSUAL}% mensual (~45% EA).`
        }
    }
    
    return { excede: false }
}

