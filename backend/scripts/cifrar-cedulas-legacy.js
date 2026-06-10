import 'dotenv/config'
import { prisma } from '../src/lib/prisma.js'
import { cifrar, descifrar, generarHash } from '../src/services/crypto.service.js'

async function main() {
    console.log('🏁 Iniciando migración y cifrado de cédulas heredadas...')
    
    // Obtener todas las personas
    const personas = await prisma.persona.findMany()
    console.log(`🔍 Se encontraron ${personas.length} registros en total.`)
    
    let actualizados = 0

    for (const p of personas) {
        let cedulaOriginal = p.cedula
        let cedulaCifrada = p.cedula
        let cedulaHash = p.cedula_hash

        // 1. Determinar si la cédula en la BD está cifrada
        const partes = String(cedulaOriginal).split(':')
        const estaCifrada = partes.length === 3

        if (estaCifrada) {
            try {
                // Descifrar para recuperar el valor real y calcular el hash
                cedulaOriginal = descifrar(p.cedula)
            } catch (err) {
                console.error(`⚠️ Error al descifrar cédula para ID ${p.id}. Saltando...`)
                continue
            }
        } else {
            // Cifrar la cédula plana
            cedulaCifrada = cifrar(cedulaOriginal)
        }

        // 2. Calcular el hash determinístico SHA-256
        cedulaHash = generarHash(cedulaOriginal)

        // 3. Actualizar base de datos si falta el hash o si se cifró la cédula
        if (!p.cedula_hash || !estaCifrada) {
            await prisma.persona.update({
                where: { id: p.id },
                data: {
                    cedula: cedulaCifrada,
                    cedula_hash: cedulaHash
                }
            })
            actualizados++
            console.log(`✅ Registro actualizado (ID: ${p.id}) — Cédula cifrada e indexada con Hash.`)
        }
    }

    console.log(`🎉 Migración finalizada. Registros actualizados: ${actualizados}`)
}

main()
    .catch((e) => {
        console.error('❌ Error fatal en migración:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
