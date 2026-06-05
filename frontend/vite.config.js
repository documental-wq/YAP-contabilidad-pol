import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: isProd ? {
        './mockDb': path.resolve(__dirname, './src/utils/mockDb.stub.js')
      } : {}
    },
    server: {
      host: true, // listen on all network interfaces
      port: 5173,
    },
  }
})
