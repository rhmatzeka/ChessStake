import Link from "next/link";
import { Sprite } from "./Sprite";

const NAV = [
  { href: "/events", label: "Events" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/rules", label: "Rules" },
  { href: "/sponsor", label: "Sponsors" },
];

export function Header() {
  return (
    <header className="border-b border-line bg-background/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
          <Sprite piece="pawn" size={28} />
          PawnPool
        </Link>
        <nav aria-label="Main" className="order-3 flex w-full gap-5 text-sm text-muted md:order-none md:w-auto">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="py-1 transition-colors hover:text-foreground">
              {n.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/events/practice"
          className="rounded-md border border-gold/60 px-3.5 py-1.5 text-sm font-medium text-gold transition-colors hover:bg-gold hover:text-black"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
