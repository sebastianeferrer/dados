import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El sitio se sirve desde https://sebastianeferrer.github.io/dados/, por lo
// tanto Vite debe generar URLs de assets bajo `/dados/`. En `dev` (vite) no
// queremos el prefijo, así que sólo lo aplicamos en build.
// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/dados/' : '/',
}))
