export type Quality = "best" | "okay" | "blunder";

const BADGES: Record<Quality, { text: string; glyph: string; classes: string }> = {
  best: { text: "Best", glyph: "\u2713", classes: "border-gold/70 bg-gold/10 text-gold" },
  okay: { text: "Okay", glyph: "~", classes: "border-line text-muted" },
  blunder: { text: "Blunder", glyph: "!", classes: "border-foreground/35 text-foreground/85" },
};

export function qualityBadge(q: Quality): { text: string; glyph: string; classes: string } {
  return BADGES[q];
}

/** Evaluation for White in pawns: "+0.4", "-1.2", "Even", "Mate" when clamped. */
export function formatEval(cp: number): string {
  if (Math.abs(cp) >= 1000) return cp > 0 ? "Winning" : "Losing";
  if (Math.abs(cp) < 5) return "Even";
  const v = (cp / 100).toFixed(1);
  return cp > 0 ? `+${v}` : v;
}
