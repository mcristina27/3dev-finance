import { bold } from "../theme/boldTheme";

/** Colorcitos seleccionables para un evento de Agenda — usados en el swatch picker y en los puntos del calendario. */
export const AGENDA_COLORS: { key: string; value: string; bg: string }[] = [
  { key: "mint", value: bold.mint, bg: bold.mintLight },
  { key: "pink", value: bold.pink, bg: bold.pinkLight },
  { key: "yellow", value: bold.yellowDark, bg: bold.yellowLight },
  { key: "blue", value: bold.blue, bg: bold.blueLight },
  { key: "purple", value: bold.purple, bg: bold.purpleLight },
  { key: "red", value: bold.red, bg: bold.redLight },
];

export const DEFAULT_AGENDA_COLOR = bold.mint;
