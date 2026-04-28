# 🎲 Dados

App web para llevar el puntaje de **Generala** y **Yahtzee** desde el navegador, con dados virtuales opcionales, historial de partidas, ranking de jugadores y soporte de modo claro/oscuro.

🔗 **Demo en vivo:** [sebastianeferrer.github.io/dados](https://sebastianeferrer.github.io/dados/)

---

## Features

- **Dos variantes**: Generala Clásica (11 categorías) y Yahtzee / Generala Moderna (13 categorías + bonus de upper section).
- **Dados virtuales opcionales**: 3 tiros máximo, fijar/desfijar dados entre tiros, sugerencia automática del puntaje según la categoría elegida.
- **Control de turno**: detecta cuando se anota fuera de orden y permite reordenar a los jugadores.
- **Edición y reapertura de partida**: corregir anotaciones después de cerrar.
- **Empates resueltos correctamente**: ambos jugadores quedan en 1°.
- **Generala servida = victoria instantánea**: gana sin importar el puntaje acumulado.
- **Historial persistente**: cada partida se guarda en `localStorage` con detalle completo y ranking global de jugadores.
- **Modo claro / oscuro** con preferencia del sistema.
- **Mobile-friendly** y sin backend — todo corre en el navegador.

## Cómo jugar

Al iniciar una partida elegís:

- **Variante**: Clásica o Yahtzee.
- **Dados virtuales**: usar los dados de la app, o sólo llevar puntaje (los tirás vos físicamente).
- **Control de turno**: la app avisa si se anota fuera de orden.

Después agregás los nombres de los jugadores (entre 2 y 10) y empieza la partida. Tocás cualquier celda libre para anotar puntos: la app te ofrece las opciones válidas según la categoría y los dados.

### Generala Clásica

11 categorías. Puntaje fijo más bonus de **+5** si se logra **servida** (en el primer tiro). Generala Doble requiere haber anotado Generala primero.

| Categoría | Puntaje | Servida |
|---|---|---|
| Unos a Seises | suma de la cara correspondiente | — |
| Escalera (1-2-3-4-5 o 2-3-4-5-6) | 20 | +5 |
| Full (3 + 2) | 30 | +5 |
| Poker (4 iguales) | 40 | +5 |
| Generala (5 iguales) | 50 | gana la partida |
| Generala Doble (segunda generala) | 100 | — |

📚 Reglas detalladas: [Generala — Wikipedia](https://es.wikipedia.org/wiki/Generala)

### Yahtzee / Generala Moderna

13 categorías repartidas en dos secciones. Si la **sección superior** suma ≥ 63 puntos, ganás un **bonus de +35**. Las combinaciones tienen +5 servida (excepto Generalas y Chance).

**Sección superior** — Unos a Seises (igual que la clásica).

**Sección inferior:**

| Categoría | Puntaje | Servida |
|---|---|---|
| Trío (3+ iguales) | suma de los 5 dados | +5 |
| Poker (4 iguales) | 40 | +5 |
| Full | 30 | +5 |
| Escalera Corta (4 consecutivos) | 20 | +5 |
| Escalera Larga (5 consecutivos) | 40 | +5 |
| Generala | 50 | gana la partida |
| Generala Doble | 100 | — |
| **Chance** (comodín) | aplica las reglas de cualquier otra categoría disponible; se anota en Chance y la categoría destino queda libre | según la categoría elegida |

📚 Reglas detalladas: [Yahtzee — Wikipedia](https://en.wikipedia.org/wiki/Yahtzee)

## Stack

- **React 19** + **TypeScript**
- **Vite 8** (build / dev server)
- Sin librerías de UI: CSS plano con variables para light/dark
- Persistencia: `localStorage`
- Despliegue: **GitHub Pages**

## Desarrollo local

Requisitos: **Node.js 20+** y **npm**.

```bash
git clone https://github.com/sebastianeferrer/dados.git
cd dados
npm install
npm run dev          # http://localhost:5173
```

Scripts disponibles:

| Comando | Acción |
|---|---|
| `npm run dev` | dev server con HMR |
| `npm run build` | type-check + build de producción a `dist/` |
| `npm run preview` | servir el build localmente |
| `npm run lint` | correr ESLint |
| `npm run deploy` | deploy manual a GitHub Pages |

## Deploy en tu propio repositorio

La app está pensada para servirse desde un **subpath** (típicamente `/<repo-name>/`). Si la querés desplegar bajo tu cuenta:

### 1. Configurar el subpath

Editá [`vite.config.ts`](./vite.config.ts) y reemplazá `'/dados/'` por `'/<tu-repo>/'`:

```ts
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/<tu-repo>/' : '/',
}))
```

Y en [`package.json`](./package.json) actualizá `homepage`:

```json
"homepage": "https://<tu-usuario>.github.io/<tu-repo>"
```

### 2. Deploy manual con `gh-pages`

```bash
npm install
npm run deploy
```

Esto corre `npm run build` y publica `dist/` en la rama `gh-pages`. Después en GitHub: **Settings → Pages → Source: gh-pages branch (root)**.

### 3. Deploy automático (CI)

El repo incluye [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml): cada push a `main` dispara un build y publica a `gh-pages` automáticamente. No requiere tokens extra — usa el `GITHUB_TOKEN` que GitHub provee.

### Otros hostings

Si preferís Netlify, Vercel o Cloudflare Pages: el sitio es 100% estático. Build command `npm run build`, output `dist`. **Importante:** en hostings que sirven en la raíz (no subpath), cambiá el `base` a `'/'` en `vite.config.ts`.

## Estructura

```
src/
├── components/      # Scoreboard, ScoreModal, DiceRoller, HistoryScreen, ...
├── games/           # generala.ts: categorías, reglas y cálculo de puntajes
├── hooks/           # useGameState, useHistory, useTheme
├── types/           # game.ts, history.ts
└── index.css        # estilos globales con variables de tema
```

## Issues y mejoras pendientes

Mejoras planeadas — animación 3D de los dados, tracker de probabilidades, etc — están registradas como [issues](https://github.com/sebastianeferrer/dados/issues). Si encontrás un bug o tenés una idea, abrí uno.

## Licencia

MIT.
