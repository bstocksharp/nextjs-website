// Pure helpers shared by the generated icons (app/apple-icon.tsx, the tab favicon
// at app/profile-icon). Kept framework-free so both icon routes can import them.

/** First letter of a name, uppercased; "H" (Hub) when there's no name. */
export function iconInitial(name?: string | null): string {
  const first = (name ?? "").trim()[0];
  return first ? first.toUpperCase() : "H";
}

/** Black or white text, whichever contrasts better with a hex bg (YIQ luminance). */
export function textOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#0e1214";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 >= 140 ? "#0e1214" : "#ffffff";
}
