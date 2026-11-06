import Link from "next/link";
import { PLAY_HREF } from "@/lib/links";
import { Sprite } from "./Sprite";

const NAV = [
  { href: "/events", label: "Events" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/rules", label: "Rules" },
  { href: "/sponsor", label: "Sponsors" },
];

export function Header() {
  return (
    <header className="relative z-20 border-b border-line bg-background/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-1 px-5 py-3 md:flex-nowrap hdr-in">
        <Link href="/" className="flex items-center gap-3" aria-label="PawnPool home">
          <span className="grid h-9 w-9 place-items-center rounded-md border border-gold/50 bg-panel">
            <Sprite piece="pawn" size={24} />
          </span>
          <span className="font-mono text-[0.95rem] font-bold uppercase tracking-[0.3em]">PawnPool</span>
        </Link>
        <nav
          aria-label="Main"
          className="order-3 -mb-1 flex w-full gap-5 overflow-x-auto md:order-none md:mb-0 md:mr-auto md:w-auto md:overflow-visible"
        >
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="nav-link whitespace-nowrap">
              {n.label}
            </Link>
          ))}
        </nav>
        <Link href={PLAY_HREF} className="btn btn-gold btn-sm">
          Play now
        </Link>
      </div>
    </header>
  );
}
