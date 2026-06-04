import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

export const prisma = new PrismaClient()

// Nota: Asegúrese de que la base de datos PostgreSQL esté corriendo en localhost:5432
// o actualice el archivo .env con la URL correcta.
