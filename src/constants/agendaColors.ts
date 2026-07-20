import { pastel } from "../theme/colors";

/** Colorcitos seleccionables para un evento de Agenda — usados en el swatch picker y en los puntos del calendario. */
export const AGENDA_COLORS: { key: string; value: string; bg: string }[] = [
  { key: "yellow", value: pastel.yellowDark, bg: pastel.yellowLight },
  { key: "blue", value: pastel.blueDark, bg: pastel.blueLight },
  { key: "berry", value: pastel.berryDark, bg: pastel.berryLight },
  { key: "pistachio", value: pastel.pistachioDark, bg: pastel.pistachioLight },
  { key: "lilac", value: pastel.lilacDark, bg: pastel.lilacLight },
  { key: "orange", value: pastel.orangeDark, bg: pastel.orangeLight },
];

export const DEFAULT_AGENDA_COLOR = pastel.yellowDark;
