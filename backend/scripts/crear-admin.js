import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    const hash = await bcrypt.hash('Admin2025!', 10)
    const emailAdmin = 'admin@yap.com'
    const existing = await prisma.usuario.findUnique({ where: { correo: emailAdmin } })

    if (existing) {
        await prisma.usuario.update({
            where: { correo: emailAdmin },
            data: { password: hash, estado: 'activo', rol: 'superadmin' }
        })
        console.log(`✅ Usuario actualizado: ${emailAdmin} / Admin2025!`)
    } else {
        await prisma.usuario.create({
            data: {
                nombre: 'Administrador Principal YAP',
                correo: emailAdmin,
                password: hash,
                rol: 'superadmin',
                estado: 'activo'
            }
        })
        console.log(`✅ Usuario creado: ${emailAdmin} / Admin2025!`)
    }

    await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
