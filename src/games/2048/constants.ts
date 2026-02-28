interface TileColor {
  bg: string;
  text: string;
}

export const TILE_COLORS: Record<number, TileColor> = {
  2: { bg: "var(--color-foreground)", text: "var(--color-text)" },
  4: { bg: "var(--color-border)", text: "var(--color-text)" },
  8: { bg: "var(--color-accent)", text: "var(--color-accent-contrast)" },
  16: { bg: "var(--color-info)", text: "var(--color-info-contrast)" },
  32: { bg: "var(--color-success)", text: "var(--color-success-contrast)" },
  64: { bg: "var(--color-warning)", text: "var(--color-warning-contrast)" },
  128: { bg: "var(--color-primary)", text: "var(--color-primary-contrast)" },
  256: { bg: "var(--color-primary-hover)", text: "var(--color-primary-contrast)" },
  512: { bg: "var(--color-error)", text: "var(--color-error-contrast)" },
  1024: { bg: "var(--color-error)", text: "var(--color-error-contrast)" },
  2048: { bg: "var(--color-error)", text: "var(--color-error-contrast)" },
};

export const DEFAULT_TILE: TileColor = {
  bg: "var(--color-text-secondary)",
  text: "var(--color-background)",
};
