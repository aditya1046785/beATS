// Deterministic date formatting.
// Plain `new Date(x).toLocaleDateString()` picks up the runtime's default
// locale, which differs between the server (en-US -> "5/31/2026") and the
// browser (e.g. en-IN -> "31/05/2026"). That produces React hydration
// mismatches. Formatting from the UTC components keeps the string identical
// on both server and client, regardless of locale or timezone.
export function formatDate(value: string | number | Date): string {
  const [y, m, day] = new Date(value).toISOString().slice(0, 10).split("-");
  return `${day}/${m}/${y}`; // DD/MM/YYYY
}
