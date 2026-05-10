# Changelog

Todos los cambios notables en este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

## [2.0.0] - 2026-05-10

### ✨ Nuevas Características

#### Statistics Tracker & Probability Calculator
- **Captura automática de tiradas**: Registra automáticamente cada tirada de dados virtuales (valores, combinación detectada, categoría aplicada, jugador, variante)
- **Persistencia en localStorage**: Almacena hasta 1000 tiradas con sistema FIFO (first-in-first-out) para evitar crecimiento ilimitado
- **Pantalla dedicada de Estadísticas**: Nueva pantalla accesible desde el botón "Stats" en el header

#### Visualización de Datos con Recharts
- **Distribución de valores 1-6**: Gráfico de barras vertical con iconos de dados, incluyendo línea de referencia teórica al 16.67% (distribución uniforme)
- **Frecuencia de combinaciones**: Gráfico horizontal que muestra la frecuencia de cada tipo de combinación detectada (Generala, Poker, Full, Trío, Escalera, Doble Par, Par, Nada)
- **Comparación Probabilidad Observada vs Teórica**: Gráfico de barras agrupadas comparando probabilidades reales con teóricas (disponible con mínimo 30 tiradas)

#### Filtrado por Variante
- Filtro en la pantalla de Stats que permite ver estadísticas separadas por variante de juego:
  - Clásica
  - Generahtzee
  - Yahtzee Original
  - Todas (combinadas)

#### Resumen de Estadísticas
- **Cards de resumen**: Muestra total de tiradas (lifetime), tiradas de la sesión actual, y cantidad de partidas trackeadas
- **Últimas tiradas**: Lista de las últimas 20 tiradas con datos: dados, combinación, jugador, marca de "servida" si aplica, y variante

#### Gestión de Datos
- **Reset de estadísticas**: Botón para limpiar todas las estadísticas acumuladas con confirmación para evitar accidentes
- **Soporte de sesión**: Distingue entre estadísticas de la sesión actual (desde el reload) y lifetime (todas las tiradas registradas)

#### Dark Mode
- Soporte automático para dark mode en todos los gráficos mediante resolución de CSS variables en tiempo de renderización
- Los colores de los charts se adaptan al tema actual sin necesidad de lógica especial

### 🔧 Cambios Técnicos

#### Nuevas Dependencias
- `recharts@^3.8.1`: Librería de gráficos React declarativa y de alto rendimiento

#### Nuevos Archivos
- `src/types/stats.ts`: Definiciones de tipos TypeScript
  - `CombinationType`: Union type de 9 tipos de combinaciones
  - `RollRecord`: Estructura de una tirada registrada
  - `RollStatsStore`: Shape de datos en localStorage
  - `StatsVariantFilter`: Tipo para filtro de variantes

- `src/games/detectCombination.ts`: Función pura de detección de combinaciones
  - Algoritmo de prioridad: generala > poker > full > trio > escaleraLarga > escaleraCorta > doblePar > par > nada
  - Sin dependencias externas

- `src/hooks/useRollStats.ts`: Custom hook con patrón localStorage
  - Lazy initialization al mount
  - Sync automático a localStorage en cada cambio
  - FIFO rotation a 1000 rolls
  - Métodos: `addRoll()`, `clearStats()`, `getRolls()`, `getSessionRolls()`

- `src/components/StatsScreen.tsx`: Componente principal de estadísticas (~350 líneas)
  - 5 secciones: header, cards de resumen, distribución de valores, frecuencia de combinaciones, comparación de probabilidades, últimas tiradas
  - 3 gráficos Recharts
  - Filtro por variante
  - Reset con confirmación
  - Soporte de dark mode

#### Archivos Modificados
- `src/App.tsx`:
  - Import de `useRollStats`, `StatsScreen`, `detectCombination`
  - Nuevo state `showStats` (booleano, excluyente con `showHistory`)
  - Hook `useRollStats()` instantiado
  - Handler `handleRecordRoll()` que captura tiradas
  - Botón "Stats" en header con badge de contador
  - Routing a `<StatsScreen />` cuando `showStats` es true

- `src/components/Scoreboard.tsx`:
  - Props agregadas: `gameId: string`, `onRecordRoll?: (...) => void`
  - Captura de tirada en `handleScoreConfirm()` (solo para scoring nuevo, no ediciones)
  - Llama `onRecordRoll()` con todos los datos necesarios antes de limpiar `activeRoll`

- `src/index.css`:
  - ~130 líneas de estilos nuevos para StatsScreen
  - `.stats-screen`, `.stats-cards`, `.stats-section`
  - Estilos para tooltips de Recharts
  - Estilos para lista de últimas tiradas
  - Responsive breakpoints

#### Probabilidades Teóricas Incluidas
```
Generala:       0.077%
Poker:          2.0%
Full:           3.86%
Escalera Larga: 3.09%
Escalera Corta: 12.35%
Trío:           15.43%
Doble Par:      23.15%
Par:            46.09%
```

### 📝 Notas
- Las tiradas se registran automáticamente al anotar puntaje (solo si está habilitado "dados virtuales")
- Las probabilidades teóricas son para una tirada de 5 dados sin repetir. Los datos observados incluyen re-tiros con dados fijados, por lo que divergen naturalmente
- La pantalla de Stats muestra un mensaje explicativo cuando hay menos de 30 tiradas registradas
- Cada reload de página inicia una nueva "sesión", permitiendo comparar stats de sesión actual vs lifetime

### 🔄 Cambios Respecto v1.0.0
- **Nueva pantalla completa** dedicada a estadísticas
- **3 gráficos interactivos** con Recharts
- **Persistencia de 1000 tiradas** en localStorage
- **Filtrado por variante** en tiempo real
- **Detección automática de combinaciones** en cada tirada
- **Dark mode support** en todos los gráficos
- **Badge de contador** en el botón Stats del header
- **Reset con confirmación** para evitar pérdida accidental de datos

### 🐛 Información de Compilación
- TypeScript: Sin errores
- Build: Exitoso (182.75 kB gzipped)
- Bundle: Optimizado con Vite

---

## [1.0.0] - 2026-04-28

### ✨ Características Iniciales

- **Três variantes de juego**: Generala Clásica, Generahtzee, Yahtzee Original
- **3D Dice Animation**: Dados virtuales 3D renderizados con CSS transforms
- **Sistema de puntaje completo**: Scoreboard interactivo con categorías dinámicas
- **Control de turno**: Detección y aviso de jugadas fuera de orden
- **Historial de partidas**: Registro persistente de todas las partidas jugadas
- **Ranking de jugadores**: Estadísticas por jugador (wins, losses, total games)
- **Dark mode**: Tema claro y oscuro automático
- **Responsive design**: Compatible con desktop, tablet y mobile
- **Sin dependencias externas**: Solo React y React-DOM

