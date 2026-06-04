import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

async function main() {
    const persona = await prisma.persona.findFirst()
    const tipo = await prisma.tipoPrestamo.findFirst()
    if (!persona || !tipo) {
        console.log("No data for persona or tipo")
        return
    }

    const token = jwt.sign({ id: 'admin-id' }, 'creditos_coraza_cta_secret_2025')
    const res = await fetch('http://localhost:3001/api/prestamos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({
            persona_id: persona.id,
            tipo_id: tipo.id,
            monto: 1000000,
            cuotas: 12,
            fechaPrimerPago: '2023-11-01',
            tasasPersonalizadas: []
        })
    })
    console.log(await res.json())
}

main()
