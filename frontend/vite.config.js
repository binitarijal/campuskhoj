import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendRoot = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  // The Google client ID is public. Read only VITE_-prefixed values from the
  // backend env file; private backend credentials never enter Vite's define map.
  const backendPublicEnv = loadEnv(mode, path.resolve(frontendRoot, '../backend'), 'VITE_')
  const frontendPublicEnv = loadEnv(mode, frontendRoot, 'VITE_')
  const googleClientId = backendPublicEnv.VITE_GOOGLE_CLIENT_ID || frontendPublicEnv.VITE_GOOGLE_CLIENT_ID || ''

  return {
    plugins: [react()],
    server: {
      headers: { 'Cross-Origin-Opener-Policy': 'same-origin-allow-popups' },
    },
    define: {
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(googleClientId),
    },
  }
})
