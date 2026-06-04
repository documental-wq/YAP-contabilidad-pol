import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
    try {
        const empresa = await prisma.empresa.findFirst()
        if (!empresa) {
            console.log('No hay empresas')
            return
        }
        const cedula = '99999999'
        // Eliminar si ya existe de un test anterior
        await prisma.persona.deleteMany({ where: { cedula } })

        const nueva = await prisma.persona.create({
            data: {
                primer_nombre: 'Test',
                primer_apellido: 'User',
                cedula,
                empresa_id: empresa.id
            }
        })
        console.log('Persona creada:', nueva.id)
        await prisma.persona.delete({ where: { id: nueva.id } })
        console.log('Persona eliminada (test exitoso)')
    } catch (e) {
        console.error('Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

test()
