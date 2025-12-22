import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Optionnel : génère tes propres certificats ou utilise des auto-signés
const certPath = path.resolve(__dirname, 'cert.pem')
const keyPath = path.resolve(__dirname, 'key.pem')

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // écoute toutes les interfaces réseau
    https: {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    },
    port: 5173
  }
})
