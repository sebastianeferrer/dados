import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json' with { type: 'json' }

// El sitio se sirve desde https://sebastianeferrer.github.io/dados/, por lo
// tanto Vite debe generar URLs de assets bajo `/dados/`. En `dev` (vite) no
// queremos el prefijo, así que sólo lo aplicamos en build.
// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/dados/' : '/',
  // Inyecta la versión del package.json como constante global en el bundle.
  // Se consume en la UI como `__APP_VERSION__`.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
}))
