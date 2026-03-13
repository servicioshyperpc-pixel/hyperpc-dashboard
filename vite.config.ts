import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const base = process.env.VERCEL ? '/' : '/hyperpc-dashboard/'

export default defineConfig({
  plugins: [react()],
  base,
})
