import fs from 'fs'
import path from 'path'
import Decimal from 'decimal.js'

// We configure Decimal to Mode Half Up
Decimal.set({ precision: 20, rounding: 4 })

const redondear2 = (n) => new Decimal(n).toDecimalPlaces(2).toNumber()
const redondear4 = (n) => new Decimal(n).toDecimalPlaces(4).toNumber()
const redondear6 = (n) => new Decimal(n).toDecimalPlaces(6).toNumber()

function obtenerTasaQuincenal(tasa) {
    const v = new Decimal(tasa.valor_porcentaje || 0)
    const tipo = tasa.tipo_calculo
    switch (tipo) {
        case 'porcentaje_periodico':
        case 'porcentaje_simple':
            return redondear6(v)
        case 'porcentaje_mensual':
            return redondear6(v.dividedBy(2))
        case 'porcentaje_anual':
            return redondear6(v.dividedBy(24))
        case 'monto_fijo':
            return null
        default:
            return redondear6(v)
    }
}

function calcularCuotaFija(principal, tasaQuincenal, cuotas) {
    const p = new Decimal(principal)
    const tq = new Decimal(tasaQuincenal)
    const c = new Decimal(cuotas)
    if (tq.isZero()) return redondear2(p.dividedBy(c))
    const r = tq.dividedBy(100)
    const factor = new Decimal(1).plus(r).pow(c)
    const numerador = p.times(r.times(factor))
    const denominador = factor.minus(1)
    return redondear2(numerador.dividedBy(denominador))
}

function calcularPrestamo({ montoOtorgado, numeroCuotas, tasasAsignadas, fechaPrimerPago }) {
    const tasasPeriodicas = tasasAsignadas.filter(t => t.activa && !t.es_cargo_unico && !t.es_tasa_mora)
    const tasasUnicas = tasasAsignadas.filter(t => t.activa && t.es_cargo_unico)

    const mOtorgado = new Decimal(montoOtorgado)
    const nCuotas = parseInt(numeroCuotas)

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

        let interesPuroParaAmortizar = new Decimal(0)
        if (usaCuotaFija) {
            const tasaDec = new Decimal(tQuincenalInteres).dividedBy(100)
            interesPuroParaAmortizar = saldoInicial.times(tasaDec)
        }

        let capitalEstaCuota = new Decimal(0)
        if (i === nCuotas) {
            capitalEstaCuota = saldoInicial
        } else if (usaCuotaFija) {
            capitalEstaCuota = cuotaFijaBase.minus(interesPuroParaAmortizar)
        } else {
            capitalEstaCuota = capitalConstante
        }

        let interesesEstaCuota = new Decimal(0)
        const desglose = []

        for (const tasa of tasasPeriodicas) {
            const base = tasa.aplica_sobre === 'saldo_pendiente' ? saldoInicial : mOtorgado
            let valor = new Decimal(0)
            const tipoCalc = tasa.tipo_calculo
            if (tipoCalc === 'monto_fijo') {
                valor = new Decimal(tasa.valor_fijo || 0)
            } else {
                const tasaQ = obtenerTasaQuincenal(tasa)
                const tasaDec = new Decimal(tasaQ).dividedBy(100)
                valor = base.times(tasaDec)
            }
            interesesEstaCuota = interesesEstaCuota.plus(valor)
            desglose.push({
                nombre: tasa.nombre,
                tipo: tipoCalc,
                base: base.toNumber(),
                tasaQ: obtenerTasaQuincenal(tasa),
                valor: redondear2(valor.toNumber()),
                esUnico: false
            })
        }

        let cargosUnicos = new Decimal(0)
        if (i === 1) {
            for (const cargo of tasasUnicas) {
                const v = new Decimal(cargo.valor_porcentaje || 0)
                let valor = new Decimal(0)
                const tipoCalc = cargo.tipo_calculo
                if (tipoCalc === 'monto_fijo') {
                    valor = new Decimal(cargo.valor_fijo || 0)
                } else {
                    const decV = v.dividedBy(100)
                    valor = mOtorgado.times(decV)
                }
                cargosUnicos = cargosUnicos.plus(valor)
                desglose.push({
                    nombre: cargo.nombre,
                    base: mOtorgado.toNumber(),
                    tasaQ: v.toNumber(),
                    valor: redondear2(valor.toNumber()),
                    esUnico: true
                })
            }
        }

        const cuotaTotal = capitalEstaCuota.plus(interesesEstaCuota).plus(cargosUnicos)
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
    const costoFinanciero = redondear2(sumCuotaTotal.minus(mOtorgado).toNumber())
    const tasaEfectiva = redondear4(new Decimal(costoFinanciero).dividedBy(mOtorgado).times(100).toNumber())
    const cuotaPrimera = tablaCuotas[0].cuotaTotal

    let sumSiguientes = new Decimal(0)
    if (nCuotas > 1) {
        tablaCuotas.slice(1).forEach(c => {
            sumSiguientes = sumSiguientes.plus(c.cuotaTotal)
        })
    }
    const cuotaEstandar = nCuotas > 1 ? redondear2(sumSiguientes.dividedBy(nCuotas - 1).toNumber()) : cuotaPrimera
    const cuotaUltima = tablaCuotas[tablaCuotas.length - 1].cuotaTotal

    return {
        montoOtorgado: mOtorgado.toNumber(),
        numeroCuotas: nCuotas,
        fechaUltimoPago: tablaCuotas[tablaCuotas.length - 1].fechaPago,
        cuotaPrimera,
        cuotaEstandar,
        cuotaUltima,
        totalCapital: mOtorgado.toNumber(),
        totalIntereses,
        totalCargosUnicos,
        totalPagado,
        costoFinanciero,
        tasaEfectiva,
        tablaCuotas
    }
}

// Today is 2026-05-20
const HOY = new Date('2026-05-20T12:00:00.000Z')

const empresas = [
    { id: 'emp-1', nombre: 'KIOTO', color: '#FF6B35', nit: '900.234.567-8', representante: 'Luis Alberto Gómez', telefono: '3124567890', correo: 'kioto@empresa.com', estado: 'activa' },
    { id: 'emp-2', nombre: 'CORAZA', color: '#1A6FFF', nit: '900.345.678-9', representante: 'María Fernanda Ruiz', telefono: '3157890123', correo: 'coraza@empresa.com', estado: 'activa' },
    { id: 'emp-3', nombre: 'YAP', color: '#9B59F5', nit: '900.456.789-0', representante: 'Carlos Eduardo Torres', telefono: '3189012345', correo: 'yap@empresa.com', estado: 'activa' }
]

const tasas = [
    { id: 'tasa-1', nombre: 'Interés Corriente', tipo_calculo: 'porcentaje_periodico', valor_porcentaje: 2.0, valor_fijo: 0, aplica_sobre: 'capital_inicial', es_cargo_unico: false, es_tasa_mora: false },
    { id: 'tasa-2', nombre: 'AUXILIO', tipo_calculo: 'porcentaje_periodico', valor_porcentaje: 12.0, valor_fijo: 0, aplica_sobre: 'capital_inicial', es_cargo_unico: false, es_tasa_mora: false },
    { id: 'tasa-3', nombre: 'Cargo Administrativo', tipo_calculo: 'porcentaje_simple', valor_porcentaje: 1.5, valor_fijo: 0, aplica_sobre: 'capital_inicial', es_cargo_unico: true, es_tasa_mora: false },
    { id: 'tasa-4', nombre: 'Seguro de Vida', tipo_calculo: 'porcentaje_periodico', valor_porcentaje: 0.25, valor_fijo: 0, aplica_sobre: 'saldo_pendiente', es_cargo_unico: false, es_tasa_mora: false },
    { id: 'tasa-5', nombre: 'Interés de Mora', tipo_calculo: 'porcentaje_periodico', valor_porcentaje: 3.0, valor_fijo: 0, aplica_sobre: 'saldo_pendiente', es_cargo_unico: false, es_tasa_mora: true },
    { id: 'tasa-6', nombre: 'Aval Solidario', tipo_calculo: 'porcentaje_simple', valor_porcentaje: 0.5, valor_fijo: 0, aplica_sobre: 'capital_inicial', es_cargo_unico: true, es_tasa_mora: false },
    { id: 'tasa-7', nombre: 'Fondo Solidario', tipo_calculo: 'porcentaje_periodico', valor_porcentaje: 0.75, valor_fijo: 0, aplica_sobre: 'capital_inicial', es_cargo_unico: false, es_tasa_mora: false }
]

const tipos = [
    { id: 'tipo-1', nombre: 'Libre Inversión', cuotas_maximas: 24, monto_minimo: 100000, monto_maximo: 50000000, estado: 'activo', tasasIds: ['tasa-1', 'tasa-3', 'tasa-4', 'tasa-6'] },
    { id: 'tipo-2', nombre: 'Calamidad Familiar', cuotas_maximas: 12, monto_minimo: 100000, monto_maximo: 5000000, estado: 'activo', tasasIds: ['tasa-1', 'tasa-3'] },
    { id: 'tipo-3', nombre: 'Educativo', cuotas_maximas: 18, monto_minimo: 100000, monto_maximo: 8000000, estado: 'activo', tasasIds: ['tasa-1', 'tasa-3', 'tasa-4'] },
    { id: 'tipo-4', nombre: 'Salud', cuotas_maximas: 12, monto_minimo: 100000, monto_maximo: 4000000, estado: 'activo', tasasIds: ['tasa-1', 'tasa-3'] },
    { id: 'tipo-5', nombre: 'Vivienda', cuotas_maximas: 24, monto_minimo: 500000, monto_maximo: 80000000, estado: 'activo', tasasIds: ['tasa-1', 'tasa-2', 'tasa-3', 'tasa-4', 'tasa-6'] },
    { id: 'tipo-6', nombre: 'Emergencia', cuotas_maximas: 6, monto_minimo: 100000, monto_maximo: 2000000, estado: 'activo', tasasIds: ['tasa-1'] }
]

const personas = [
    { id: 'per-1', primer_nombre: 'Juan', segundo_nombre: 'Carlos', primer_apellido: 'Pérez', segundo_apellido: 'Gómez', cedula: '10203040', telefono: '3109876543', correo: 'juan.perez@coraza.com', empresa_id: 'emp-2', cargo: 'Operario', estado: 'activo' },
    { id: 'per-2', primer_nombre: 'María', segundo_nombre: 'Elena', primer_apellido: 'López', segundo_apellido: 'Díaz', cedula: '20304050', telefono: '3151234567', correo: 'maria.lopez@coraza.com', empresa_id: 'emp-2', cargo: 'Supervisora', estado: 'activo' },
    { id: 'per-3', primer_nombre: 'Carlos', segundo_nombre: 'Andrés', primer_apellido: 'Restrepo', segundo_apellido: 'Ruiz', cedula: '30405060', telefono: '3001234567', correo: 'carlos.restrepo@kioto.com', empresa_id: 'emp-1', cargo: 'Técnico', estado: 'activo' },
    { id: 'per-4', primer_nombre: 'Diana', segundo_nombre: 'Carolina', primer_apellido: 'Rojas', segundo_apellido: 'Mendoza', cedula: '40506070', telefono: '3123456789', correo: 'diana.rojas@kioto.com', empresa_id: 'emp-1', cargo: 'Analista', estado: 'activo' },
    { id: 'per-5', primer_nombre: 'Jose', segundo_nombre: 'Luis', primer_apellido: 'Morales', segundo_apellido: 'Castro', cedula: '50607080', telefono: '3167890123', correo: 'jose.morales@yap.com', empresa_id: 'emp-3', cargo: 'Coordinador', estado: 'activo' },
    { id: 'per-6', primer_nombre: 'Sandra', segundo_nombre: 'Patricia', primer_apellido: 'Ortiz', segundo_apellido: 'Neira', cedula: '60708090', telefono: '3189012345', correo: 'sandra.ortiz@yap.com', empresa_id: 'emp-3', cargo: 'Auxiliar', estado: 'activo' },
    { id: 'per-7', primer_nombre: 'Fernando', segundo_nombre: 'Alonso', primer_apellido: 'Silva', segundo_apellido: 'Rincón', cedula: '70809001', telefono: '3112345670', correo: 'fernando.silva@coraza.com', empresa_id: 'emp-2', cargo: 'Operador', estado: 'activo' },
    { id: 'per-8', primer_nombre: 'Gloria', segundo_nombre: 'Inés', primer_apellido: 'Patiño', segundo_apellido: 'Ospina', cedula: '80900112', telefono: '3134567891', correo: 'gloria.patino@coraza.com', empresa_id: 'emp-2', cargo: 'Secretaria', estado: 'activo' },
    { id: 'per-9', primer_nombre: 'Jorge', segundo_nombre: 'Eliécer', primer_apellido: 'Córdoba', segundo_apellido: 'Rivas', cedula: '90011223', telefono: '3145678902', correo: 'jorge.cordoba@kioto.com', empresa_id: 'emp-1', cargo: 'Conductor', estado: 'activo' },
    { id: 'per-10', primer_nombre: 'Liliana', segundo_nombre: 'María', primer_apellido: 'Hoyos', segundo_apellido: 'Zapata', cedula: '11223344', telefono: '3176543210', correo: 'liliana.hoyos@yap.com', empresa_id: 'emp-3', cargo: 'Directora', estado: 'activo' },
    { id: 'per-11', primer_nombre: 'Andrés', segundo_nombre: 'Felipe', primer_apellido: 'Valencia', segundo_apellido: 'Marin', cedula: '22334455', telefono: '3198765432', correo: 'andres.valencia@yap.com', empresa_id: 'emp-3', cargo: 'Ingeniero', estado: 'activo' },
    { id: 'per-12', primer_nombre: 'Olga', segundo_nombre: 'Lucía', primer_apellido: 'Beltrán', segundo_apellido: 'Peña', cedula: '33445566', telefono: '3209876543', correo: 'olga.beltran@coraza.com', empresa_id: 'emp-2', cargo: 'Asistente', estado: 'activo' },
    { id: 'per-13', primer_nombre: 'Gustavo', segundo_nombre: 'Adolfo', primer_apellido: 'Quintero', segundo_apellido: 'Ortiz', cedula: '44556677', telefono: '3210987654', correo: 'gustavo.quintero@coraza.com', empresa_id: 'emp-2', cargo: 'Vigilante', estado: 'activo' },
    { id: 'per-14', primer_nombre: 'Claudia', segundo_nombre: 'Ximena', primer_apellido: 'Herrera', segundo_apellido: 'Tobón', cedula: '55667788', telefono: '3221098765', correo: 'claudia.herrera@kioto.com', empresa_id: 'emp-1', cargo: 'Diseñadora', estado: 'activo' },
    { id: 'per-15', primer_nombre: 'Mauricio', segundo_nombre: 'de Jesús', primer_apellido: 'Cardona', segundo_apellido: 'Serna', cedula: '66778899', telefono: '3232109876', correo: 'mauricio.cardona@yap.com', empresa_id: 'emp-3', cargo: 'Administrador', estado: 'activo' },
    { id: 'per-16', primer_nombre: 'Martha', segundo_nombre: 'Cecilia', primer_apellido: 'Henao', segundo_apellido: 'Giraldo', cedula: '77889900', telefono: '3243210987', correo: 'martha.henao@kioto.com', empresa_id: 'emp-1', cargo: 'Operaria', estado: 'activo' },
    { id: 'per-17', primer_nombre: 'Jaime', segundo_nombre: 'Alberto', primer_apellido: 'Urrego', segundo_apellido: 'Alzate', cedula: '88990011', telefono: '3254321098', correo: 'jaime.urrego@coraza.com', empresa_id: 'emp-2', cargo: 'Jefe Planta', estado: 'activo' },
    { id: 'per-18', primer_nombre: 'Angela', segundo_nombre: 'María', primer_apellido: 'Echeverry', segundo_apellido: 'Londoño', cedula: '99001122', telefono: '3265432109', correo: 'angela.echeverry@yap.com', empresa_id: 'emp-3', cargo: 'Contadora', estado: 'activo' },
    { id: 'per-19', primer_nombre: 'Wilson', segundo_nombre: 'de Jesús', primer_apellido: 'Vargas', segundo_apellido: 'Rúa', cedula: '10111213', telefono: '3276543210', correo: 'wilson.vargas@yap.com', empresa_id: 'emp-3', cargo: 'Técnico', estado: 'activo' },
    { id: 'per-20', primer_nombre: 'Patricia', segundo_nombre: 'Elena', primer_apellido: 'Jaramillo', segundo_apellido: 'Restrepo', cedula: '14151617', telefono: '3287654321', correo: 'patricia.jaramillo@kioto.com', empresa_id: 'emp-1', cargo: 'Recepcionista', estado: 'activo' }
]

// Specs for 20 loans:
// status: 'activo' | 'finalizado' | 'en_mora' | 'pendiente_aprobacion'
// paidCuotasCount: how many of the first cuotas are already paid
// startMonthsAgo: how many months ago the loan was granted
const prestamosSpecs = [
    { id: 'pres-1', personaId: 'per-1', tipoId: 'tipo-1', monto: 1200000, cuotas: 12, status: 'activo', startMonthsAgo: 3, paidCuotasCount: 6 },
    { id: 'pres-2', personaId: 'per-2', tipoId: 'tipo-2', monto: 800000, cuotas: 8, status: 'finalizado', startMonthsAgo: 5, paidCuotasCount: 8 },
    { id: 'pres-3', personaId: 'per-3', tipoId: 'tipo-5', monto: 3000000, cuotas: 24, status: 'en_mora', startMonthsAgo: 4, paidCuotasCount: 4 },
    { id: 'pres-4', personaId: 'per-4', tipoId: 'tipo-3', monto: 2500000, cuotas: 18, status: 'activo', startMonthsAgo: 5, paidCuotasCount: 8 },
    { id: 'pres-5', personaId: 'per-5', tipoId: 'tipo-1', monto: 5000000, cuotas: 24, status: 'en_mora', startMonthsAgo: 3, paidCuotasCount: 3 },
    { id: 'pres-6', personaId: 'per-6', tipoId: 'tipo-6', monto: 400000, cuotas: 4, status: 'finalizado', startMonthsAgo: 3, paidCuotasCount: 4 },
    { id: 'pres-7', personaId: 'per-7', tipoId: 'tipo-4', monto: 1500000, cuotas: 12, status: 'activo', startMonthsAgo: 5, paidCuotasCount: 10 },
    { id: 'pres-8', personaId: 'per-8', tipoId: 'tipo-6', monto: 300000, cuotas: 6, status: 'finalizado', startMonthsAgo: 4, paidCuotasCount: 6 },
    { id: 'pres-9', personaId: 'per-9', tipoId: 'tipo-1', monto: 2000000, cuotas: 12, status: 'en_mora', startMonthsAgo: 4, paidCuotasCount: 2 },
    { id: 'pres-10', personaId: 'per-10', tipoId: 'tipo-5', monto: 10000000, cuotas: 24, status: 'activo', startMonthsAgo: 6, paidCuotasCount: 12 },
    { id: 'pres-11', personaId: 'per-11', tipoId: 'tipo-3', monto: 4500000, cuotas: 18, status: 'en_mora', startMonthsAgo: 5, paidCuotasCount: 6 },
    { id: 'pres-12', personaId: 'per-12', tipoId: 'tipo-2', monto: 600000, cuotas: 6, status: 'finalizado', startMonthsAgo: 5, paidCuotasCount: 6 },
    { id: 'pres-13', personaId: 'per-13', tipoId: 'tipo-4', monto: 1800000, cuotas: 12, status: 'activo', startMonthsAgo: 3, paidCuotasCount: 4 },
    { id: 'pres-14', personaId: 'per-14', tipoId: 'tipo-1', monto: 3500000, cuotas: 24, status: 'en_mora', startMonthsAgo: 2, paidCuotasCount: 0 },
    { id: 'pres-15', personaId: 'per-15', tipoId: 'tipo-2', monto: 1000000, cuotas: 8, status: 'finalizado', startMonthsAgo: 5, paidCuotasCount: 8 },
    { id: 'pres-16', personaId: 'per-16', tipoId: 'tipo-3', monto: 2200000, cuotas: 12, status: 'activo', startMonthsAgo: 2, paidCuotasCount: 2 },
    { id: 'pres-17', personaId: 'per-17', tipoId: 'tipo-5', monto: 7500000, cuotas: 24, status: 'activo', startMonthsAgo: 4, paidCuotasCount: 8 },
    { id: 'pres-18', personaId: 'per-18', tipoId: 'tipo-4', monto: 1200000, cuotas: 12, status: 'activo', startMonthsAgo: 0, paidCuotasCount: 0 },
    { id: 'pres-19', personaId: 'per-19', tipoId: 'tipo-1', monto: 2000000, cuotas: 12, status: 'pendiente_aprobacion', startMonthsAgo: 0, paidCuotasCount: 0 },
    { id: 'pres-20', personaId: 'per-20', tipoId: 'tipo-6', monto: 500000, cuotas: 6, status: 'pendiente_aprobacion', startMonthsAgo: 0, paidCuotasCount: 0 }
]

const generatedPrestamos = []
const generatedCuotas = []
const generatedPagos = []

// Loop to calculate all
prestamosSpecs.forEach((spec, idx) => {
    // Determine the start date of the loan
    const fechaOtorgado = new Date(HOY)
    fechaOtorgado.setMonth(fechaOtorgado.getMonth() - spec.startMonthsAgo)
    // Make sure it lands on a clean date
    fechaOtorgado.setDate(15)

    const fechaPrimerPago = new Date(fechaOtorgado)
    fechaPrimerPago.setDate(fechaPrimerPago.getDate() + 15)

    // Find the loan type to get applied rates
    const elTipo = tipos.find(t => t.id === spec.tipoId)
    const tasasAsignadas = tasas.filter(t => elTipo.tasasIds.includes(t.id)).map(t => ({ ...t, activa: true }))

    // Add Interest Mora manually if not in type
    if (!tasasAsignadas.some(t => t.es_tasa_mora)) {
        const tasaMora = tasas.find(t => t.es_tasa_mora)
        if (tasaMora) tasasAsignadas.push({ ...tasaMora, activa: true })
    }

    const calcResult = calcularPrestamo({
        montoOtorgado: spec.monto,
        numeroCuotas: spec.cuotas,
        tasasAsignadas,
        fechaPrimerPago
    })

    const prestamoId = spec.id
    const codigo = `LYAP${String(idx + 1).padStart(5, '0')}`

    // Now generate the cuotas and updates based on spec.paidCuotasCount and spec.status
    const cuotasObj = calcResult.tablaCuotas.map(c => {
        const isPaid = c.numeroCuota <= spec.paidCuotasCount
        let cuotaEstado = isPaid ? 'pagada' : 'pendiente'
        let fechaRealPago = null
        let diasAtraso = 0
        let interesMora = 0

        const fechaProgramada = new Date(c.fechaPago)

        // If not paid, and scheduled in the past, calculate arrears
        if (!isPaid && fechaProgramada < HOY) {
            const diffTime = Math.abs(HOY - fechaProgramada)
            diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            
            // Interest mora = saldo_pendiente * (3% quincenal) * (diasAtraso / 15)
            // Or simple daily rate mora
            const tasaMora = tasas.find(t => t.es_tasa_mora)
            const valorMoraPorcentaje = tasaMora ? tasaMora.valor_porcentaje : 3.0
            const interesMoraCalc = new Decimal(c.saldoInicio)
                .times(new Decimal(valorMoraPorcentaje).dividedBy(100))
                .times(new Decimal(diasAtraso).dividedBy(15))
            interesMora = redondear2(interesMoraCalc.toNumber())

            if (spec.status === 'en_mora' || spec.status === 'activo') {
                cuotaEstado = 'pendiente' // still pending, but has arrears
            }
        }

        if (isPaid) {
            // Pagado exactly on time or 1 day early
            const frp = new Date(fechaProgramada)
            frp.setDate(frp.getDate() - Math.floor(Math.random() * 2))
            fechaRealPago = frp
        }

        const cuotaFinalTotal = c.cuotaTotal + interesMora

        return {
            id: `cuota-${prestamoId}-${c.numeroCuota}`,
            prestamo_id: prestamoId,
            persona_id: spec.personaId,
            numero_cuota: c.numeroCuota,
            fecha_programada: fechaProgramada,
            fecha_real_pago: fechaRealPago,
            dias_de_atraso: diasAtraso,
            saldo_inicio: c.saldoInicio,
            capital_cuota: c.capitalAbonado,
            intereses_cuota: c.interesesCobrados,
            cargos_unicos: c.cargosUnicos,
            interes_mora: interesMora,
            cuota_total: c.cuotaTotal,
            cuota_total_final: cuotaFinalTotal,
            saldo_final: c.saldoFinal,
            estado: cuotaEstado,
            desglose_tasas: JSON.stringify(c.desglose)
        }
    })

    // Now generate payments for paid cuotas
    cuotasObj.forEach(c => {
        if (c.estado === 'pagada') {
            const pagoId = `pago-${prestamoId}-${c.numero_cuota}`
            generatedPagos.push({
                id: pagoId,
                prestamo_id: prestamoId,
                persona_id: spec.personaId,
                numero_cuota: c.numero_cuota,
                fecha_pago: c.fecha_real_pago,
                quincena: `${c.fecha_programada.getFullYear()}-Q${c.fecha_programada.getMonth() * 2 + (c.fecha_programada.getDate() <= 15 ? 1 : 2)}`,
                monto_pagado: c.cuota_total,
                saldo_antes: c.saldo_inicio,
                saldo_despues: c.saldo_final,
                interes_mora_cobrado: 0,
                dias_de_atraso: 0,
                metodo_pago: 'Descuento de nómina',
                numero_comprobante: `COMP-${Math.floor(100000 + Math.random() * 900000)}`,
                observacion: 'Descuento quincenal automático de nómina'
            })
            c.pago_id = pagoId
        }
    })

    // Determine loan status
    let finalStatus = spec.status
    if (spec.status === 'en_mora') {
        finalStatus = 'en_mora'
    } else if (spec.status === 'activo' && cuotasObj.some(c => c.estado === 'pendiente' && c.fecha_programada < HOY)) {
        finalStatus = 'en_mora' // force mora if past due
    }

    // Determine upcoming payment date
    const proximaCuota = cuotasObj.find(c => c.estado === 'pendiente')
    const proximoPago = proximaCuota ? proximaCuota.fecha_programada : null

    // Determine last payment date
    const ultimasPagadas = cuotasObj.filter(c => c.estado === 'pagada')
    const ultimoPago = ultimasPagadas.length > 0 ? ultimasPagadas[ultimasPagadas.length - 1].fecha_real_pago : null

    generatedPrestamos.push({
        id: prestamoId,
        codigo,
        persona_id: spec.personaId,
        numero_prestamo: 1,
        tipo_id: spec.tipoId,
        monto_otorgado: calcResult.montoOtorgado,
        numero_cuotas: calcResult.numeroCuotas,
        cuota_primera: calcResult.cuotaPrimera,
        cuota_estandar: calcResult.cuotaEstandar,
        cuota_ultima: calcResult.cuotaUltima,
        total_capital: calcResult.totalCapital,
        total_intereses: calcResult.totalIntereses,
        total_cargos: calcResult.totalCargosUnicos,
        total_a_pagar: calcResult.totalPagado,
        costo_financiero: calcResult.costoFinanciero,
        tasa_efectiva_total: calcResult.tasaEfectiva,
        cuotas_pagadas: spec.paidCuotasCount,
        fecha_otorgado: fechaOtorgado,
        fecha_primer_pago: fechaPrimerPago,
        fecha_ultimo_pago: calcResult.fechaUltimoPago,
        ultimo_pago: ultimoPago,
        proximo_pago: proximoPago,
        estado: finalStatus,
        creado_por: 'usr-admin',
        tasasAsignadas // snapshot for mockDb
    })

    generatedCuotas.push(...cuotasObj)
})

console.log(`Generated ${generatedPrestamos.length} loans, ${generatedCuotas.length} installments, ${generatedPagos.length} payments.`)

// ----------------------------------------------------
// 1. UPDATE backend/prisma/seed.js
// ----------------------------------------------------
const seedFilePath = 'c:/Users/Mirley/Downloads/CALCULO _APP CONTABILIDAD/backend/prisma/seed.js'

const prismaSeedCode = `import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Limpiar base de datos
  await prisma.configuracion.deleteMany()
  await prisma.usuario.deleteMany()
  await prisma.registroPago.deleteMany()
  await prisma.cuotaProgramada.deleteMany()
  await prisma.prestamTasa.deleteMany()
  await prisma.prestamo.deleteMany()
  await prisma.persona.deleteMany()
  await prisma.informeGenerado.deleteMany()
  await prisma.empresa.deleteMany()
  await prisma.tipoPrestamo_Tasa.deleteMany()
  await prisma.tipoPrestamo.deleteMany()
  await prisma.tasaInteres.deleteMany()

  // 1 Usuario SuperAdmin
  const admin = await prisma.usuario.create({
    data: {
      nombre: 'Administrador Principal',
      correo: 'admin@coraza.com',
      password: await bcrypt.hash('Admin123!', 10),
      rol: 'superadmin',
      empresa: 'CORAZA'
    }
  })

  // Tasas de interés
  const tasas = ${JSON.stringify(tasas, null, 2)}
  for (const t of tasas) {
    await prisma.tasaInteres.create({ data: t })
  }

  // Empresas
  const empresas = ${JSON.stringify(empresas, null, 2)}
  for (const e of empresas) {
    await prisma.empresa.create({ data: e })
  }

  // Tipos de préstamo y sus relaciones
  const tipos = ${JSON.stringify(tipos, null, 2)}
  for (const tipo of tipos) {
    const tp = await prisma.tipoPrestamo.create({
      data: {
        id: tipo.id,
        nombre: tipo.nombre,
        cuotas_maximas: tipo.cuotas_maximas,
        monto_minimo: tipo.monto_minimo,
        monto_maximo: tipo.monto_maximo,
        estado: tipo.estado
      }
    })
    for (const [index, tasaId] of tipo.tasasIds.entries()) {
      await prisma.tipoPrestamo_Tasa.create({
        data: {
          tipo_id: tp.id,
          tasa_id: tasaId,
          orden: index + 1
        }
      })
    }
  }

  // Personas
  const personas = ${JSON.stringify(personas, null, 2)}
  for (const p of personas) {
    await prisma.persona.create({ data: p })
  }

  // Préstamos
  const prestamos = ${JSON.stringify(generatedPrestamos, null, 2)}
  for (const p of prestamos) {
    const { tasasAsignadas, ...pData } = p
    await prisma.prestamo.create({
      data: {
        ...pData,
        tasas_aplicadas: {
          create: tasasAsignadas.map((t, idx) => ({
            tasa_id: t.id,
            nombre_snapshot: t.nombre,
            tipo_calculo_snapshot: t.tipo_calculo,
            valor_snapshot: t.valor_porcentaje || t.valor_fijo,
            aplica_sobre_snapshot: t.aplica_sobre,
            es_cargo_unico: t.es_cargo_unico || false,
            es_tasa_mora: t.es_tasa_mora || false,
            activa: true,
            orden: idx + 1
          }))
        }
      }
    })
  }

  // Cuotas Programadas
  const cuotas = ${JSON.stringify(generatedCuotas, null, 2)}
  // Batch insert cuotas
  for (const c of cuotas) {
    await prisma.cuotaProgramada.create({ data: c })
  }

  // Pagos
  const pagos = ${JSON.stringify(generatedPagos, null, 2)}
  for (const p of pagos) {
    await prisma.registroPago.create({ data: p })
  }

  console.log('✅ Base de datos inicializada con 20 préstamos correctamente (Seed)')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
`

fs.writeFileSync(seedFilePath, prismaSeedCode)
console.log('Successfully wrote backend/prisma/seed.js')

// ----------------------------------------------------
// 2. UPDATE frontend/src/utils/mockDb.js
// ----------------------------------------------------
const mockDbFilePath = 'c:/Users/Mirley/Downloads/CALCULO _APP CONTABILIDAD/frontend/src/utils/mockDb.js'
let mockDbContent = fs.readFileSync(mockDbFilePath, 'utf8')

// We will replace defaultPersonas and add defaultPrestamos, defaultCuotas, defaultPagos
const defaultPersonasStr = `const defaultPersonas = ${JSON.stringify(personas, null, 4)};`
const defaultPrestamosStr = `const defaultPrestamos = ${JSON.stringify(generatedPrestamos, null, 4)};`
const defaultCuotasStr = `const defaultCuotas = ${JSON.stringify(generatedCuotas, null, 4)};`
const defaultPagosStr = `const defaultPagos = ${JSON.stringify(generatedPagos, null, 4)};`

// Let's replace defaultPersonas in mockDbContent
const personasRegex = /const defaultPersonas = \[\s*[\s\S]*?\s*\];/
mockDbContent = mockDbContent.replace(personasRegex, `${defaultPersonasStr}\n\n${defaultPrestamosStr}\n\n${defaultCuotasStr}\n\n${defaultPagosStr}`)

// Now let's update mockDb.js local storage lookups to use these new default values:
// 1. mock_prestamos lookup: getLocalStorage('mock_prestamos', []) -> getLocalStorage('mock_prestamos', defaultPrestamos)
mockDbContent = mockDbContent.replaceAll("getLocalStorage('mock_prestamos', [])", "getLocalStorage('mock_prestamos', defaultPrestamos)")
// 2. mock_cuotas lookup: getLocalStorage('mock_cuotas', []) -> getLocalStorage('mock_cuotas', defaultCuotas)
mockDbContent = mockDbContent.replaceAll("getLocalStorage('mock_cuotas', [])", "getLocalStorage('mock_cuotas', defaultCuotas)")
// 3. mock_pagos lookup: getLocalStorage('mock_pagos', []) -> getLocalStorage('mock_pagos', defaultPagos)
mockDbContent = mockDbContent.replaceAll("getLocalStorage('mock_pagos', [])", "getLocalStorage('mock_pagos', defaultPagos)")

fs.writeFileSync(mockDbFilePath, mockDbContent)
console.log('Successfully updated frontend/src/utils/mockDb.js')
