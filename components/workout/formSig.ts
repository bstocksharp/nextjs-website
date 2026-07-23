// Stable serialization of a <form>'s current field values — used by the builder's
// auto-save components to skip a submit when a blur/change didn't actually change
// anything (avoids a needless revalidate + row flicker). FormData preserves DOM
// order and omits unchecked checkboxes, so the string is stable across blurs.
export function formSig(form: HTMLFormElement): string {
  return Array.from(new FormData(form).entries())
    .map(([k, v]) => `${k}=${String(v)}`)
    .join("&");
}
