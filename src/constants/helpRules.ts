import type { GameVariant } from '../types/game';

export interface HelpSection {
  title: string;
  items: string[];
}

export interface HelpContent {
  variant: GameVariant;
  name: string;
  intro: string;
  sections: HelpSection[];
}

export const HELP_RULES: Record<GameVariant, HelpContent> = {
  classic: {
    variant: 'classic',
    name: 'Generala Clásica',
    intro: 'Variante tradicional rioplatense con 11 categorías. Cada jugador tira hasta 3 veces por turno y debe anotar en una categoría.',
    sections: [
      {
        title: 'Sección numérica',
        items: [
          'Unos a Seises: suma de los dados con ese valor (ej. tres 4 = 12).',
        ],
      },
      {
        title: 'Combinaciones',
        items: [
          'Escalera (1-2-3-4-5, 2-3-4-5-6 o 1-3-4-5-6): 20 puntos. Servida (al primer tiro) +5 = 25.',
          'Full (tres iguales + par): 30 puntos. Servida +5 = 35.',
          'Poker (4 iguales): 40 puntos. Servida +5 = 45.',
          'Generala (5 iguales): 50 puntos. Servida = victoria instantánea.',
          'Generala Doble: 100 puntos. Requiere haber anotado Generala antes.',
        ],
      },
      {
        title: 'Reglas',
        items: [
          'En cada turno tirás hasta 3 veces; podés guardar dados entre tiros.',
          'Si no podés (o no querés) anotar, tachás una categoría con 0.',
          'Gana quien sume más al completar todas las categorías, salvo Generala servida (gana al instante).',
        ],
      },
    ],
  },

  yahtzee: {
    variant: 'yahtzee',
    name: 'Generahtzee',
    intro: 'Variante híbrida: combina la estructura del Yahtzee (sección superior con bonus) con el espíritu de la Generala (servida +5, victoria instantánea por Generala servida).',
    sections: [
      {
        title: 'Sección Superior',
        items: [
          'Unos a Seises: igual que en Generala.',
          'Bonus +35 si la suma de la sección superior llega a 63 puntos.',
        ],
      },
      {
        title: 'Sección Inferior',
        items: [
          'Trío (≥3 iguales): suma de los 5 dados. Servida +5.',
          'Full: 30 pts. Servida +5 = 35.',
          'Poker (≥4 iguales): 40 pts. Servida +5 = 45.',
          'Escalera Corta (4 consecutivos): 20 pts. Servida +5 = 25.',
          'Escalera Larga (5 consecutivos, acepta 1-3-4-5-6): 40 pts. Servida +5 = 45.',
          'Generala (5 iguales): 50 pts. Servida = victoria instantánea.',
          'Generala Doble: 100 pts. Requiere Generala previa.',
          'Chance: comodín. Podés derivar la tirada a cualquier categoría libre.',
        ],
      },
      {
        title: 'Reglas',
        items: [
          'Hasta 3 tiros por turno. Servida = se anota al primer tiro.',
          'Generala servida (5 iguales en el primer tiro) gana la partida.',
        ],
      },
    ],
  },

  yahtzeeOriginal: {
    variant: 'yahtzeeOriginal',
    name: 'Yahtzee Original',
    intro: 'Reglas oficiales del Yahtzee. 13 categorías, sin bonus por servida, escalera larga estricta y Yahtzee Bonus acumulable de +100 por cada quinteto adicional.',
    sections: [
      {
        title: 'Sección Superior',
        items: [
          'Unos a Seises: suma de los dados con ese valor.',
          'Bonus +35 si la sección superior alcanza 63 puntos.',
        ],
      },
      {
        title: 'Sección Inferior',
        items: [
          'Trío (3 iguales): suma de los 5 dados.',
          'Poker (4 iguales): suma de los 5 dados.',
          'Full House: 25 puntos fijos.',
          'Escalera Corta (4 consecutivos): 30 puntos fijos.',
          'Escalera Larga (5 consecutivos, NO acepta 1-3-4-5-6): 40 puntos fijos.',
          'Yahtzee (5 iguales): 50 puntos fijos.',
          'Chance: suma libre de los 5 dados.',
        ],
      },
      {
        title: 'Yahtzee Bonus',
        items: [
          'Después de anotar tu primer Yahtzee con valor 50, cada Yahtzee adicional suma +100 al bonus acumulable.',
          'Si tu Yahtzee inicial fue tachado (0), no se generan bonus posteriores.',
          'El Yahtzee Bonus se calcula automáticamente al confirmar una jugada con 5 iguales.',
        ],
      },
      {
        title: 'Reglas',
        items: [
          'Hasta 3 tiros por turno; podés guardar dados entre tiros.',
          'Sin "servida" — los puntajes son fijos sin importar el número de tiros.',
          'Gana quien sume más al completar las 13 categorías.',
        ],
      },
    ],
  },
};
