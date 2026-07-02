import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Pour GitHub Pages en "project page" (https://user.github.io/mon-repo/),
// définissez VITE_BASE_PATH=/mon-repo/ dans les variables du repo (Settings > Secrets and variables > Actions > Variables).
// Laissez sur '/' si vous déployez sur un domaine personnalisé ou une "user/org page".
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
})
