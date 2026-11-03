import { formatCountdown } from "@/lib/time";
import type { TurnClock } from "@/hooks/useEventState";

const TURN_MS = 15_000;

/** Shows what is happening now. The visible countdown ticks every 250 ms; the screen-reader text only changes every 5 s. */
export function TurnBar({
  turnNumber,
  clock,
  thinking,
  note,
}: {
  turnNumber: number | null;
  clock: TurnClock | null;
  thinking: boolean;
  note?: string;
}) {
  const left = clock?.untilEnd ?? 0;
  const secs = Math.ceil(left / 1000);
  const bucket = Math.ceil(secs / 5) * 5;
  const open = !!clock?.isOpen && !thinking;
  const title = thinking ? "AI Boss is thinking" : open ? "Your move" : note ?? "Next turn opens in a moment";
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-2.5 sm:py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg font-bold leading-tight">
            {title}
            {thinking && (
              <span aria-hidden="true" className="ml-1 inline-flex gap-0.5">
                <span className="thinking-dot">.</span>
                <span className="thinking-dot">.</span>
                <span className="thinking-dot">.</span>
              </span>
            )}
          </p>
          <p className="hidden text-sm text-muted sm:block">
            {turnNumber ? `Turn ${turnNumber}. ` : ""}
            {open ? "Pick one of the 3 moves. The most-picked move is played." : thinking ? "The crowd's move is in. The Boss replies next." : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-4xl font-extrabold leading-none tabular-nums text-gold" aria-hidden="true">
            {clock && open ? secs : "-"}
          </p>
          <p className="text-xs text-muted">seconds</p>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div
          className="h-full rounded-full bg-gold"
          style={{ width: `${open ? Math.min(100, (left / TURN_MS) * 100) : 0}%`, transition: "width 250ms linear" }}
        />
      </div>
      <span className="sr-only" aria-live="polite">
        {open ? `${formatCountdown(bucket * 1000)} left to pick` : thinking ? "AI Boss is thinking" : ""}
      </span>
    </div>
  );
}
