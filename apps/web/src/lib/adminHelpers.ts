const WIB_OFFSET_MS = 7 * 3_600_000;
const LOCAL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** `datetime-local` value read as WIB (UTC+7) -> ISO string in UTC. */
export function wibLocalToIso(local: string): string {
  if (!LOCAL_RE.test(local)) throw new Error("Pick a date and time");
  const ms = Date.parse(`${local}:00Z`);
  if (Number.isNaN(ms)) throw new Error("Pick a date and time");
  return new Date(ms - WIB_OFFSET_MS).toISOString();
}

/** ISO instant -> `datetime-local` value showing WIB. */
export function isoToWibLocal(iso: string): string {
  return new Date(new Date(iso).getTime() + WIB_OFFSET_MS).toISOString().slice(0, 16);
}

/** Human-readable WIB stamp for tables, e.g. "4 Nov 2026, 03:00 WIB". */
export function formatWib(iso: string): string {
  const d = new Date(new Date(iso).getTime() + WIB_OFFSET_MS);
  const mon = d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  return `${d.getUTCDate()} ${mon} ${d.getUTCFullYear()}, ${d.toISOString().slice(11, 16)} WIB`;
}

const MESSAGES: Record<string, string> = {
  SLUG_TAKEN: "That slug is already used",
  SLUG_RESERVED: "That slug is reserved",
  EVENT_LOCKED: "This event already started",
  NOT_ELIGIBLE: "This player is not eligible for a prize",
};

export function adminErrorMessage(code: string, fallback: string): string {
  return MESSAGES[code] ?? fallback;
}
