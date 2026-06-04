import Decimal from 'decimal.js'
import { redondear2, redondear6 } from './financiero.service.js'

export function calcularMora(cuota, fechaPagoReal, tasaMora) {
    const diffTime = Math.max(0, new Date(fechaPagoReal) - new Date(cuota.fecha_programada))
    const diasAtraso = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diasAtraso === 0 || !tasaMora) return { diasAtraso: 0, quincenasAtraso: 0, interesMora: 0, tasaUsada: 0 }

    const v = new Decimal(tasaMora.valor_snapshot ?? tasaMora.valor_porcentaje)
    const quincenasAtraso = redondear6(new Decimal(diasAtraso).dividedBy(15).toNumber())

    // interesMora = saldo_inicio * (v / 100) * quincenasAtraso
    const saldoInit = new Decimal(cuota.saldo_inicio)
    const decV = v.dividedBy(100)
    const intMora = saldoInit.times(decV).times(quincenasAtraso)

    return {
        diasAtraso,
        quincenasAtraso,
        interesMora: redondear2(intMora.toNumber()),
        tasaUsada: v.toNumber()
    }
}

// TODO: Daily cron job at 7am to evaluate mora across all active loans.
