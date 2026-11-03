import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 text-sm text-muted sm:flex-row sm:justify-between">
        <div className="max-w-xs">
          <p className="font-display text-base font-bold text-foreground">PawnPool</p>
          <p className="mt-1">Free to play. Prizes are given by sponsors.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/rules" className="hover:text-foreground">Rules</Link>
          <Link href="/rules#terms" className="hover:text-foreground">Terms</Link>
          <Link href="/rules#privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/sponsor" className="hover:text-foreground">For sponsors</Link>
          <Link href="/host" className="hover:text-foreground">For creators</Link>
        </nav>
      </div>
    </footer>
  );
}
