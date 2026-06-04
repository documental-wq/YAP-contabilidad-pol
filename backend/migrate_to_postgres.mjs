/**
 * ============================================================
 * YAP - Script de Migración SQLite → PostgreSQL
 * ============================================================
 * 
 * INSTRUCCIONES DE USO:
 * 
 * PASO 1: Configurar PostgreSQL
 *   Opción A - Local: Instalar PostgreSQL y crear base de datos:
 *     CREATE DATABASE yap_db;
 *     CREATE USER yap_user WITH ENCRYPTED PASSWORD 'tu_contraseña';
 *     GRANT ALL PRIVILEGES ON DATABASE yap_db TO yap_user;
 * 
 *   Opción B - Cloud (Recomendado): Crear proyecto gratis en Supabase (supabase.com)
 *     y copiar la cadena de conexión PostgreSQL del panel de configuración.
 * 
 * PASO 2: Configurar .env
 *   Cambiar el provider en schema.prisma a "postgresql" y actualizar DATABASE_URL
 * 
 * PASO 3: Ejecutar migración
 *   node migrate_to_postgres.js
 * 
 * ============================================================
 */

import { PrismaClient as PrismaClientSQLite } from '@prisma/client'
import { createRequire } from 'module'
import readline from 'readline'

const require = createRequire(import.meta.url)

// ── Configuración ─────────────────────────────────────────────
const SQLITE_URL = 'file:./prisma/dev.db'

// ── Utilidades de consola ──────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const preguntar = (msg) => new Promise(resolve => rl.question(msg, resolve))

const log = {
    info:    (msg) => console.log(`  ℹ️  ${msg}`),
    ok:      (msg) => console.log(`  ✅ ${msg}`),
    warn:    (msg) => console.log(`  ⚠️  ${msg}`),
    error:   (msg) => console.log(`  ❌ ${msg}`),
    section: (msg) => console.log(`\n${'═'.repeat(60)}\n  ${msg}\n${'═'.repeat(60)}`),
    step:    (msg) => console.log(`\n  ➡️  ${msg}`)
}

// ── Script Principal ───────────────────────────────────────────
async function main() {
    log.section('🚀 YAP - Migrador SQLite → PostgreSQL')

    log.info('Este script exporta todos los datos de tu base de datos SQLite')
    log.info('y los importa en tu nueva base de datos PostgreSQL.')
    log.warn('Asegúrate de que en schema.prisma el provider sea "postgresql"')
    log.warn('y DATABASE_URL apunte a tu servidor PostgreSQL antes de continuar.')

    const confirmacion = await preguntar('\n  ¿Deseas continuar? (si/no): ')
    if (!confirmacion.toLowerCase().startsWith('s')) {
        log.info('Migración cancelada.')
        rl.close()
        process.exit(0)
    }

    rl.close()

    // ── LEER DATOS DE SQLite ─────────────────────────────────────
    log.step('Conectando a SQLite y leyendo datos...')

    const prismaSQLite = new PrismaClientSQLite({
        datasources: { db: { url: SQLITE_URL } }
    })

    let datos = {}
    try {
        const [
            empresas, configuraciones, tasasInteres, tiposPrestamo,
            tiposPrestamo_Tasa, usuarios, personas, prestamos,
            prestamTasas, cuotasProgramadas, registrosPago, informesGenerados
        ] = await Promise.all([
            prismaSQLite.empresa.findMany(),
            prismaSQLite.configuracion.findMany(),
            prismaSQLite.tasaInteres.findMany(),
            prismaSQLite.tipoPrestamo.findMany(),
            prismaSQLite.tipoPrestamo_Tasa.findMany(),
            prismaSQLite.usuario.findMany(),
            prismaSQLite.persona.findMany(),
            prismaSQLite.prestamo.findMany(),
            prismaSQLite.prestamTasa.findMany(),
            prismaSQLite.cuotaProgramada.findMany(),
            prismaSQLite.registroPago.findMany(),
            prismaSQLite.informeGenerado.findMany()
        ])

        datos = {
            empresas, configuraciones, tasasInteres, tiposPrestamo,
            tiposPrestamo_Tasa, usuarios, personas, prestamos,
            prestamTasas, cuotasProgramadas, registrosPago, informesGenerados
        }

        log.ok(`Datos leídos de SQLite:`)
        log.info(`  • ${empresas.length} empresas`)
        log.info(`  • ${configuraciones.length} configuraciones`)
        log.info(`  • ${tasasInteres.length} tasas de interés`)
        log.info(`  • ${tiposPrestamo.length} tipos de préstamo`)
        log.info(`  • ${usuarios.length} usuarios`)
        log.info(`  • ${personas.length} personas (clientes)`)
        log.info(`  • ${prestamos.length} préstamos`)
        log.info(`  • ${cuotasProgramadas.length} cuotas programadas`)
        log.info(`  • ${registrosPago.length} registros de pago`)

    } catch (err) {
        log.error(`Error leyendo SQLite: ${err.message}`)
        await prismaSQLite.$disconnect()
        process.exit(1)
    } finally {
        await prismaSQLite.$disconnect()
    }

    // ── VERIFICAR CONEXIÓN A POSTGRESQL ─────────────────────────
    log.step('Verificando conexión a PostgreSQL...')
    log.warn('Asegúrate de haber ejecutado: npx prisma migrate dev --name init')
    log.warn('para crear las tablas en PostgreSQL antes de continuar.\n')

    // Nota: PrismaClient aquí usará DATABASE_URL del .env que debe apuntar a PG
    const { PrismaClient: PrismaClientPG } = require('@prisma/client')
    const prismaPG = new PrismaClientPG()

    try {
        await prismaPG.$connect()
        log.ok('Conexión a PostgreSQL exitosa!')
    } catch (err) {
        log.error(`No se pudo conectar a PostgreSQL: ${err.message}`)
        log.warn('Verifica que DATABASE_URL en .env apunte correctamente a tu servidor PostgreSQL.')
        await prismaPG.$disconnect()
        process.exit(1)
    }

    // ── IMPORTAR EN ORDEN (respetando FK) ─────────────────────────
    log.step('Importando datos en PostgreSQL...')

    try {
        // 1. Sin dependencias
        log.info('Importando configuraciones...')
        for (const row of datos.configuraciones) {
            await prismaPG.configuracion.upsert({ where: { clave: row.clave }, update: row, create: row })
        }
        log.ok(`${datos.configuraciones.length} configuraciones importadas`)

        log.info('Importando empresas...')
        for (const row of datos.empresas) {
            await prismaPG.empresa.upsert({ where: { id: row.id }, update: row, create: row })
        }
        log.ok(`${datos.empresas.length} empresas importadas`)

        log.info('Importando usuarios...')
        for (const row of datos.usuarios) {
            await prismaPG.usuario.upsert({ where: { id: row.id }, update: row, create: row })
        }
        log.ok(`${datos.usuarios.length} usuarios importados`)

        log.info('Importando tasas de interés...')
        for (const row of datos.tasasInteres) {
            await prismaPG.tasaInteres.upsert({ where: { id: row.id }, update: row, create: row })
        }
        log.ok(`${datos.tasasInteres.length} tasas importadas`)

        log.info('Importando tipos de préstamo...')
        for (const row of datos.tiposPrestamo) {
            await prismaPG.tipoPrestamo.upsert({ where: { id: row.id }, update: row, create: row })
        }
        log.ok(`${datos.tiposPrestamo.length} tipos de préstamo importados`)

        log.info('Importando relaciones TipoPrestamo_Tasa...')
        for (const row of datos.tiposPrestamo_Tasa) {
            await prismaPG.tipoPrestamo_Tasa.upsert({ where: { id: row.id }, update: row, create: row })
        }
        log.ok(`${datos.tiposPrestamo_Tasa.length} relaciones importadas`)

        // 2. Dependen de empresa
        log.info('Importando personas (clientes)...')
        for (const row of datos.personas) {
            await prismaPG.persona.upsert({ where: { id: row.id }, update: row, create: row })
        }
        log.ok(`${datos.personas.length} personas importadas`)

        // 3. Dependen de persona + tipo
        log.info('Importando préstamos...')
        for (const row of datos.prestamos) {
            await prismaPG.prestamo.upsert({ where: { id: row.id }, update: row, create: row })
        }
        log.ok(`${datos.prestamos.length} préstamos importados`)

        // 4. Dependen de préstamo
        log.info('Importando tasas aplicadas a préstamos...')
        for (const row of datos.prestamTasas) {
            await prismaPG.prestamTasa.upsert({ where: { id: row.id }, update: row, create: row })
        }
        log.ok(`${datos.prestamTasas.length} tasas de préstamos importadas`)

        log.info('Importando cuotas programadas...')
        for (const row of datos.cuotasProgramadas) {
            await prismaPG.cuotaProgramada.upsert({ where: { id: row.id }, update: row, create: row })
        }
        log.ok(`${datos.cuotasProgramadas.length} cuotas importadas`)

        log.info('Importando registros de pago...')
        for (const row of datos.registrosPago) {
            await prismaPG.registroPago.upsert({ where: { id: row.id }, update: row, create: row })
        }
        log.ok(`${datos.registrosPago.length} pagos importados`)

        log.info('Importando informes generados...')
        for (const row of datos.informesGenerados) {
            await prismaPG.informeGenerado.upsert({ where: { id: row.id }, update: row, create: row })
        }
        log.ok(`${datos.informesGenerados.length} informes importados`)

    } catch (err) {
        log.error(`Error durante la importación: ${err.message}`)
        await prismaPG.$disconnect()
        process.exit(1)
    } finally {
        await prismaPG.$disconnect()
    }

    log.section('🎉 ¡Migración completada exitosamente!')
    log.ok('Todos los datos han sido migrados a PostgreSQL.')
    log.info('Próximos pasos:')
    log.info('  1. Verificar los datos en tu dashboard de PostgreSQL/Supabase')
    log.info('  2. Cambiar provider = "postgresql" en schema.prisma')
    log.info('  3. Actualizar DATABASE_URL en .env para apuntar a PostgreSQL')
    log.info('  4. Reiniciar el servidor backend')
    log.info('  5. ¡Hacer copia de seguridad del archivo dev.db por precaución!')
}

main().catch(err => {
    console.error('Error fatal en migración:', err)
    process.exit(1)
})
