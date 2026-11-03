import Link from "next/link";
import { Sprite } from "./Sprite";

const link = "nav-link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-[#050403]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="max-w-xs">
          <p className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-md border border-gold/50 bg-panel">
              <Sprite piece="pawn" size={24} />
            </span>
            <span className="font-mono text-[0.95rem] font-bold uppercase tracking-[0.3em]">PawnPool</span>
          </p>
          <p className="mt-4 text-sm text-muted">Your crowd plays chess against an AI Boss. Free to play. Prizes are given by sponsors.</p>
        </div>
        <nav aria-label="Footer" className="grid content-start gap-1">
          <p className="kicker kicker-muted mb-2">Play</p>
          <Link href="/events/practice" className={link}>Practice Arena</Link>
          <Link href="/events" className={link}>Events</Link>
          <Link href="/leaderboard" className={link}>Leaderboard</Link>
          <Link href="/rules" className={link}>Rules</Link>
        </nav>
        <nav aria-label="Footer, more" className="grid content-start gap-1">
          <p className="kicker kicker-muted mb-2">Work with us</p>
          <Link href="/sponsor" className={link}>For sponsors</Link>
          <Link href="/host" className={link}>For creators</Link>
          <Link href="/rules#terms" className={link}>Terms</Link>
          <Link href="/rules#privacy" className={link}>Privacy</Link>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-5 py-4 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
          Free to play. No payment, ever.
        </p>
      </div>
    </footer>
  );
}
