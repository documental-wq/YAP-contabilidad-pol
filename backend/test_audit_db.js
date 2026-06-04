import { prisma } from './src/lib/prisma.js'

async function checkLogs() {
    try {
        console.log('📡 Consultando los últimos logs de auditoría registrados en la BD...')
        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        })

        if (logs.length === 0) {
            console.log('⚠️ No hay logs en la base de datos.')
        } else {
            console.log(`✅ Se encontraron ${logs.length} logs.`)
            console.log(JSON.stringify(logs, null, 2))
        }
    } catch (err) {
        console.error('❌ Error al consultar la BD:', err.message)
    } finally {
        await prisma.$disconnect()
    }
}

checkLogs()
