/**
 * Milliseconds left until `endsAt`, using the server's clock at fetch time and the time elapsed on
 * the client since then, so a wrong device clock does not matter. All values are epoch ms.
 */
export function remainingMs(endsAt: number, serverNow: number, clientNowAtFetch: number, clientNow: number): number {
  return Math.max(0, endsAt - serverNow - (clientNow - clientNowAtFetch));
}

/** "2d 4h", "3h 12m", "5m 09s", "42s" */
export function formatCountdown(ms: number): string {
  const s = Math.ceil(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, "0")}s`;
  return `${sec}s`;
}
