const API_URL = 'http://localhost:3001/api'

async function test() {
    try {
        console.log('🔑 Obteniendo token de autenticación...')
        const authRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                correo: 'admin@coraza.com',
                password: 'Admin123!' // default password from seed
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

        // 1. Probar validación de creación de préstamo con datos inválidos (monto muy bajo)
        console.log('\n🧪 1. Probando validación de monto de préstamo bajo ($50.000)...')
        const resPrestamo = await fetch(`${API_URL}/prestamos`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                persona_id: 'cuid_dummy',
                tipo_id: 'cuid_dummy',
                monto: 50000, // < 100.000 minimum
                cuotas: 12,
                fechaPrimerPago: '2026-06-15'
            })
        })

        if (resPrestamo.status === 400) {
            console.log('🟢 Éxito: El servidor rechazó la petición con código 400.')
            const resData = await resPrestamo.json()
            console.log('Detalles recibidos:', JSON.stringify(resData, null, 2))
        } else {
            const bodyText = await resPrestamo.text()
            console.error(`❌ Error: El servidor retornó status ${resPrestamo.status} en vez de 400. Body: ${bodyText}`)
        }

        // 2. Probar registro de pago inválido (monto recibido = 0)
        console.log('\n🧪 2. Probando validación de pago con monto recibido de 0...')
        const resPago = await fetch(`${API_URL}/pagos`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                cuota_id: 'cuid_dummy',
                fecha_pago: '2026-06-01',
                monto_recibido: 0, // must be > 0
                metodo_pago: 'Transferencia bancaria'
            })
        })

        if (resPago.status === 400) {
            console.log('🟢 Éxito: El servidor rechazó la petición con código 400.')
            const resData = await resPago.json()
            console.log('Detalles recibidos:', JSON.stringify(resData, null, 2))
        } else {
            const bodyText = await resPago.text()
            console.error(`❌ Error: El servidor retornó status ${resPago.status} en vez de 400. Body: ${bodyText}`)
        }

    } catch (err) {
        console.error('❌ Error de conexión o ejecución:', err.message)
    }
}

test()
