// ─── Paleta "Bold" (estilo Foody: bordes negros, sombra dura, color plano) ────
// Prueba de estilo para Antiva — rosa + amarillo del logo de 3Dev, con negro
// en bordes/botones en vez de la paleta pastel actual.

export const bold = {
  // Fondo cálido tipo Foody
  bg: "#FBF2E4",
  surface: "#FFFFFF",

  // Rosa — color principal (del logo)
  pink: "#F13C93",
  pinkDark: "#C71C6E",
  pinkLight: "#FDD9EA",

  // Amarillo — color secundario (del logo)
  yellow: "#FFD23D",
  yellowDark: "#E6A800",
  yellowLight: "#FFF1C2",

  // Acentos fuertes para diferenciar secciones (reemplazan los pasteles)
  blue: "#4C8DFF",
  blueLight: "#D9E6FF",
  mint: "#2FD3A3",
  mintLight: "#CFF7EA",
  purple: "#8B5CF6",
  purpleLight: "#E8DEFD",

  // Rojo — alertas / stock bajo / gastos
  red: "#E23744",
  redLight: "#FBD8D9",

  // Negro / texto
  black: "#171412",
  textSecondary: "#5A5450",
  textMuted: "#9C948C",

  white: "#FFFFFF",
};

/** Borde negro grueso estándar de las cards */
export const boldBorder = {
  borderWidth: 2.5,
  borderColor: bold.black,
};

/** Sombra "dura" — offset sin blur, look retro/pegatina */
export function hardShadow(offset = 5) {
  return {
    shadowColor: bold.black,
    shadowOffset: { width: offset, height: offset },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: offset,
  };
}
