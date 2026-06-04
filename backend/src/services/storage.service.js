import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const isSupabaseConfigured = process.env.SUPABASE_URL && 
    process.env.SUPABASE_URL !== 'https://tu-proyecto.supabase.co' &&
    process.env.SUPABASE_ANON_KEY &&
    process.env.SUPABASE_ANON_KEY !== 'tu-anon-key'

const supabaseUrl = process.env.SUPABASE_URL || 'https://tu-proyecto.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'tu-anon-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Función auxiliar para persistencia local de archivos
async function guardarLocalmente(nombreArchivo, fileBuffer, carpetaDestino) {
    try {
        const uploadDir = path.join(__dirname, `../../uploads/${carpetaDestino}`)
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }
        const filePath = path.join(uploadDir, nombreArchivo)
        fs.writeFileSync(filePath, fileBuffer)
        console.log(`[StorageService] Archivo guardado localmente: uploads/${carpetaDestino}/${nombreArchivo}`)
        return `/uploads/${carpetaDestino}/${nombreArchivo}`
    } catch (err) {
        console.error('[StorageService] Error guardando archivo local:', err.message)
        throw err
    }
}

export async function subirPDFInformes(nombreArchivo, fileBuffer) {
    if (!isSupabaseConfigured) {
        return guardarLocalmente(nombreArchivo, fileBuffer, 'informes')
    }

    const { data, error } = await supabase.storage
        .from('informes')
        .upload(`pdfs/${nombreArchivo}`, fileBuffer, {
            contentType: 'application/pdf',
            upsert: true
        })

    if (error) {
        console.error('Error subiendo PDF a Supabase:', error)
        throw error
    }

    const { data: publicData } = supabase.storage
        .from('informes')
        .getPublicUrl(`pdfs/${nombreArchivo}`)

    return publicData.publicUrl
}

export async function subirImagenLogo(nombreArchivo, fileBuffer, contentType) {
    if (!isSupabaseConfigured) {
        return guardarLocalmente(nombreArchivo, fileBuffer, 'configuracion')
    }

    const { data, error } = await supabase.storage
        .from('configuracion')
        .upload(`logotipos/${nombreArchivo}`, fileBuffer, {
            contentType: contentType || 'image/jpeg',
            upsert: true
        })

    if (error) {
        console.error('Error subiendo Logo a Supabase:', error)
        throw error
    }

    const { data: publicData } = supabase.storage
        .from('configuracion')
        .getPublicUrl(`logotipos/${nombreArchivo}`)

    return publicData.publicUrl
}
