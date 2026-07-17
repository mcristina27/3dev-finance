// ─── Paleta principal (retro-cute) ───────────────────────────────────────────
// Fuente: paleta curada — colores exactos de referencia

export const pastel = {
  // Lilacs — ingresos
  lilac:      '#D3B6D3',
  lilacLight: '#F0E6F0',
  lilacSoft:  '#FAF5FA',
  lilacDark:  '#9B7A9B',

  // Florida Oranges — gastos
  orange:      '#E1903E',
  orangeLight: '#FDE8CC',
  orangeSoft:  '#FEF5EA',
  orangeDark:  '#C07030',

  // Pistachio — insumos
  pistachio:      '#CBD183',
  pistachioLight: '#EEF3D6',
  pistachioSoft:  '#F7FAF0',
  pistachioDark:  '#8A9A40',

  // Butter Yellow — agenda
  yellow:      '#EFCE7B',
  yellowLight: '#FBF2D8',
  yellowSoft:  '#FEFAEF',
  yellowDark:  '#C9A030',

  // Pea Flower — movimientos / más
  blue:      '#6777B6',
  blueLight: '#DDE0F5',
  blueSoft:  '#EEF0FB',
  blueDark:  '#4A5A9A',

  // Dusty Berry — FAB / accent
  berry:      '#D17089',
  berryLight: '#F5D8E0',
  berrySoft:  '#FDF0F3',
  berryDark:  '#A84F68',

  // Night Forest — texto oscuro
  forest: '#2B2B23',
};

// ─── Alias semánticos ─────────────────────────────────────────────────────────

export const colors = {
  primary:      pastel.berry,
  primaryLight: pastel.berryLight,
  primaryDark:  pastel.berryDark,

  income:       pastel.lilac,
  incomeLight:  pastel.lilacLight,
  incomeOnDark: pastel.lilacLight,

  expense:       pastel.orange,
  expenseLight:  pastel.orangeLight,
  expenseOnDark: pastel.orangeLight,

  agenda:      pastel.yellow,
  agendaLight: pastel.yellowLight,

  // Fondos — crema cálido de la paleta
  background:  '#F5ECE5',
  surface:     '#FFFDF9',
  surfaceAlt:  '#F7F2EE',

  // Bordes
  border:      '#E8DEDA',
  borderLight: '#F0EAE6',

  // Texto — con undertone lila/morado
  text:          '#1E1030',   // casi negro con tinte lila profundo
  textSecondary: '#5C4D72',   // morado medio suave
  textMuted:     '#A898BC',   // lila claro difuminado

  white: '#FFFFFF',
  black: '#000000',
};

// ─── Gradientes ───────────────────────────────────────────────────────────────

/** Balance positivo — lilac suave */
export const primaryGradient = ['#E2CCE2', '#D3B6D3'] as const;

/** Balance negativo — orange */
export const negativeGradient = ['#F5B97A', '#E1903E'] as const;

/** FAB — Dusty Berry */
export const fabGradient = ['#E08898', '#D17089'] as const;

// Alias de compatibilidad
export const screenGradient    = [colors.background, colors.background] as const;
export const screenBackground  = colors.background;
export const incomeGradient    = ['#E2CCE2', '#D3B6D3'] as const;
export const expenseGradient   = ['#F5B97A', '#E1903E'] as const;
