import { prisma } from './src/lib/prisma.js'

async function testValidAudit() {
    try {
        console.log('🔑 Obteniendo token de autenticación...')
        const authRes = await fetch(`http://localhost:3001/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                correo: 'admin@coraza.com',
                password: 'Admin123!'
            })
        })

        if (!authRes.ok) {
            throw new Error(`Error de autenticación: ${authRes.status}`)
        }

        const authData = await authRes.json()
        const token = authData.token
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
        console.log('✅ Token obtenido con éxito.')

        // Obtener una empresa para asociar a la persona
        console.log('\n🏢 Obteniendo primera empresa disponible...')
        const empRes = await fetch(`http://localhost:3001/api/empresas`, { headers })
        const empData = await empRes.json()
        if (!empData.empresas || empData.empresas.length === 0) {
            throw new Error('No hay empresas disponibles para asociar la persona.')
        }
        const empresaId = empData.empresas[0].id

        console.log('\n🧪 3. Creando una persona de prueba válida...')
        const randomStr = Math.random().toString(36).substring(7)
        const resPersona = await fetch(`http://localhost:3001/api/personas`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                primer_nombre: 'Test',
                primer_apellido: 'Audit',
                cedula: `12345${randomStr}`,
                empresa_id: empresaId,
                monto_requerido: 500000
            })
        })

        if (resPersona.status === 201) {
            console.log('🟢 Éxito: Persona creada (Código 201).')
            const resData = await resPersona.json()
            console.log('Detalles:', JSON.stringify(resData.persona, null, 2))
            
            console.log('\n📡 Consultando la base de datos para ver si se registró el log...')
            const logs = await prisma.auditLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: 1
            })
            
            if (logs.length > 0) {
                console.log('✅ ¡Log de auditoría encontrado en la BD!')
                console.log(JSON.stringify(logs[0], null, 2))
            } else {
                console.log('❌ No se encontró el log en la BD.')
            }

        } else {
            const bodyText = await resPersona.text()
            console.error(`❌ Error al crear persona. Status: ${resPersona.status}, Body: ${bodyText}`)
        }

    } catch (err) {
        console.error('❌ Error general:', err.message)
    } finally {
        await prisma.$disconnect()
    }
}

testValidAudit()
