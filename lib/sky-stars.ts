/**
 * Real stars for the night sky (components/constellation.tsx).
 *
 * Shapes are drawn from the stars' actual relative positions, simplified to a
 * unit box (x right, y down) and fitted to whatever open sky the screen has.
 * `mag` is apparent magnitude — smaller is brighter — and sets each star's
 * size and light; `tint` is its real colour. Named stars show their name when
 * the pointer finds them.
 */

export type SkyStar = { x: number; y: number; mag: number; tint?: string; name?: string };
export type Figure = {
  id: string;
  name: string;
  stars: SkyStar[];
  /** Pairs of indexes into `stars`: the figure's lines. */
  lines: [number, number][];
  /** Width / height of the figure's box. */
  aspect: number;
};

const WHITE = "#f4f7ff";

/**
 * The Little Dipper, with Polaris at the end of its handle. From Dhaka (about
 * 24°N) Polaris stands about 24° above the northern horizon and never sets —
 * it is there every night of the year, which is why it is always in this sky.
 */
export const littleDipper: Figure = {
  id: "ursa-minor",
  name: "Little Dipper",
  aspect: 0.9,
  stars: [
    { x: 0.08, y: 0.04, mag: 1.98, tint: "#fff3dc", name: "Polaris · the North Star" },
    { x: 0.27, y: 0.18, mag: 4.36 },
    { x: 0.42, y: 0.36, mag: 4.23 },
    { x: 0.5, y: 0.58, mag: 4.32 },
    { x: 0.76, y: 0.6, mag: 4.95 },
    { x: 0.86, y: 0.88, mag: 3.0, name: "Pherkad" },
    { x: 0.6, y: 0.92, mag: 2.08, tint: "#ffcf9a", name: "Kochab" },
  ],
  lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
};

/** One constellation per season: the one that owns the evening sky then. */
export const seasonal: Record<string, Figure> = {
  winter: {
    id: "orion",
    name: "Orion",
    aspect: 0.72,
    stars: [
      { x: 0.14, y: 0.12, mag: 0.5, tint: "#ffb978", name: "Betelgeuse" },
      { x: 0.78, y: 0.16, mag: 1.64, tint: "#dfe8ff", name: "Bellatrix" },
      { x: 0.46, y: 0.0, mag: 3.39 },
      { x: 0.36, y: 0.52, mag: 1.77, name: "Alnitak" },
      { x: 0.48, y: 0.49, mag: 1.69, name: "Alnilam" },
      { x: 0.6, y: 0.46, mag: 2.23, name: "Mintaka" },
      { x: 0.24, y: 0.94, mag: 2.07, name: "Saiph" },
      { x: 0.88, y: 0.9, mag: 0.13, tint: "#cfdcff", name: "Rigel" },
    ],
    lines: [[0, 2], [2, 1], [0, 3], [1, 5], [3, 4], [4, 5], [3, 6], [5, 7]],
  },
  spring: {
    id: "leo",
    name: "Leo",
    aspect: 1.5,
    stars: [
      { x: 0.86, y: 0.82, mag: 1.36, tint: "#e4ecff", name: "Regulus" },
      { x: 0.9, y: 0.58, mag: 3.49 },
      { x: 0.8, y: 0.36, mag: 2.08, tint: "#ffe1b0", name: "Algieba" },
      { x: 0.84, y: 0.16, mag: 3.43 },
      { x: 0.98, y: 0.04, mag: 3.88 },
      { x: 0.32, y: 0.4, mag: 2.56, name: "Zosma" },
      { x: 0.32, y: 0.64, mag: 3.33, name: "Chertan" },
      { x: 0.02, y: 0.56, mag: 2.14, name: "Denebola" },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 7], [7, 6], [6, 0]],
  },
  summer: {
    id: "scorpius",
    name: "Scorpius",
    aspect: 0.8,
    stars: [
      { x: 0.3, y: 0.3, mag: 1.06, tint: "#ff9a74", name: "Antares" },
      { x: 0.2, y: 0.12, mag: 2.29, name: "Dschubba" },
      { x: 0.27, y: 0.02, mag: 2.62, name: "Acrab" },
      { x: 0.1, y: 0.18, mag: 2.89 },
      { x: 0.37, y: 0.42, mag: 2.82 },
      { x: 0.45, y: 0.56, mag: 2.29 },
      { x: 0.48, y: 0.69, mag: 3.0 },
      { x: 0.5, y: 0.8, mag: 3.6 },
      { x: 0.6, y: 0.92, mag: 3.3 },
      { x: 0.74, y: 0.96, mag: 1.86, name: "Sargas" },
      { x: 0.84, y: 0.88, mag: 3.0 },
      { x: 0.88, y: 0.76, mag: 2.4 },
      { x: 0.94, y: 0.7, mag: 1.62, tint: "#e6eeff", name: "Shaula" },
    ],
    lines: [[3, 1], [1, 2], [1, 0], [0, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12]],
  },
  autumn: {
    id: "pegasus",
    name: "Great Square of Pegasus",
    aspect: 1.2,
    stars: [
      { x: 0.08, y: 0.22, mag: 2.06, tint: WHITE, name: "Alpheratz" },
      { x: 0.8, y: 0.16, mag: 2.42, tint: "#ffcfa0", name: "Scheat" },
      { x: 0.84, y: 0.82, mag: 2.49, name: "Markab" },
      { x: 0.12, y: 0.86, mag: 2.83, name: "Algenib" },
      { x: 0.98, y: 0.02, mag: 2.94 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [1, 4]],
  },
};
