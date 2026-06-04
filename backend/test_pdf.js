import { generarPDFHtml } from './src/services/pdf.service.js';
import fs from 'fs';

async function test() {
    try {
        console.log('Iniciando prueba de PDF...');
        const buffer = await generarPDFHtml('<h1>Test PDF</h1><p>Funciona!</p>');
        fs.writeFileSync('test_output.pdf', buffer);
        console.log('PDF generado exitosamente: test_output.pdf');
    } catch (e) {
        console.error('Error al generar PDF:', e);
    }
}

test();
