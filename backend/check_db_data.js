import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkData() {
    try {
        const empresas = await prisma.empresa.findMany()
        const personas = await prisma.persona.findMany()
        const tipos = await prisma.tipoPrestamo.findMany()

        console.log('--- DATABASE DATA REPORT ---')
        console.log('Empresas found:', empresas.length)
        console.log('Personas found:', personas.length)
        console.log('Tipos de Prestamo found:', tipos.length)

        if (personas.length > 0) {
            console.log('First persona:', personas[0].primer_nombre, personas[0].primer_apellido)
        }
        if (tipos.length > 0) {
            console.log('First loan type:', tipos[0].nombre)
        }
    } catch (e) {
        console.error('Error querying DB:', e)
    } finally {
        await prisma.$disconnect()
    }
}

checkData()
