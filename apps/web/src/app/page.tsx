import Link from "next/link";
import { listEvents, type LobbyItem } from "@/server/events";
import { Countdown } from "@/components/site/Countdown";
import { formatWib } from "@/components/site/EventCard";
import { Sprite } from "@/components/site/Sprite";

export const revalidate = 60;

async function nextEvent(): Promise<LobbyItem | null> {
  try {
    const { live, upcoming } = await listEvents();
    return live.find((e) => !e.isPractice) ?? upcoming[0] ?? null;
  } catch {
    return null;
  }
}

const EXAMPLE = [
  { piece: "knight", label: "Take the knight", pct: 58, win: true },
  { piece: "king", label: "Castle to safety", pct: 31, win: false },
  { piece: "pawn", label: "Push the center pawn", pct: 11, win: false },
] as const;

const STEPS = [
  { piece: "pawn", title: "Join an event", text: "Watch for free. Sign in with your wallet when you want to pick. No gas, no payment." },
  { piece: "knight", title: "Pick 1 of 3 moves", text: "Every turn you get 15 seconds. The move the crowd picks most is the one that gets played." },
  { piece: "queen", title: "Earn points, win prizes", text: "Better moves score more points. The top 10 of an event win the prizes its sponsor puts up." },
] as const;

export default async function Home() {
  const next = await nextEvent();
  const live = next?.status === "LIVE";

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="checker pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-12 md:grid-cols-[1.1fr_1fr] md:items-center md:pt-20">
          <div>
            <h1 className="font-display text-[2.75rem] font-extrabold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              Your community vs the AI&nbsp;Boss
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted">
              Free to play. Sponsors put up the prizes.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/events/practice"
                className="rounded-md bg-gold px-7 py-3.5 text-lg font-semibold text-black transition-colors hover:bg-[#f0b96a]"
              >
                Play now
              </Link>
              <Link href="/rules" className="py-2 text-muted underline-offset-4 hover:text-foreground hover:underline">
                How the points work
              </Link>
            </div>
          </div>

          {/* One example turn: three candidate moves, the crowd votes, the Boss waits. */}
          <figure aria-label="Example of one turn" className="rounded-2xl border border-line bg-panel/90 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <Sprite piece="king" side="Black" size={56} />
                <div>
                  <p className="font-display text-base font-bold leading-tight">AI Boss, level 3</p>
                  <p className="text-sm text-muted">Waiting for the crowd</p>
                </div>
              </div>
              <p className="text-right font-display text-3xl font-extrabold tabular-nums text-gold">
                0:09
              </p>
            </div>
            <ul className="mt-4 grid gap-3">
              {EXAMPLE.map((m) => (
                <li key={m.label}>
                  <div className="flex items-center gap-3">
                    <Sprite piece={m.piece} size={36} />
                    <span className={`flex-1 text-[15px] ${m.win ? "font-semibold" : "text-muted"}`}>{m.label}</span>
                    <span className={`tabular-nums text-sm ${m.win ? "text-gold" : "text-muted"}`}>{m.pct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className={`bar-fill h-full rounded-full ${m.win ? "bg-gold" : "bg-muted/60"}`}
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <figcaption className="mt-4 text-xs text-muted">Example turn. The crowd plays White.</figcaption>
          </figure>
        </div>
      </section>

      {/* Next event */}
      <section className="mx-auto max-w-6xl px-5">
        <div className="rounded-2xl border border-gold/40 bg-panel p-6 sm:p-8">
          {next ? (
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-gold">{live ? "Live right now" : "Next Boss Battle"}</p>
                <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{next.title}</h2>
                <p className="mt-1 text-muted">
                  Hosted by {next.hostName}
                  {next.sponsorName ? `, prizes from ${next.sponsorName}` : ""}. Boss level {next.bossLevel}.
                </p>
                {!live && <p className="mt-1 text-sm text-muted">{formatWib(next.startsAt)}</p>}
              </div>
              <div className="flex items-center gap-5">
                {!live && (
                  <p className="font-display text-3xl font-extrabold text-gold sm:text-4xl">
                    <Countdown target={Date.parse(next.startsAt)} />
                  </p>
                )}
                <Link
                  href={`/events/${next.slug}`}
                  className="rounded-md border border-gold px-5 py-2.5 font-medium text-gold transition-colors hover:bg-gold hover:text-black"
                >
                  {live ? "Join the event" : "See the event"}
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">Next Boss Battle coming soon</h2>
                <p className="mt-1 text-muted">Practice Arena is open all day while we line up the next one.</p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <Link href="/host" className="text-gold underline-offset-4 hover:underline">Host an event</Link>
                <Link href="/sponsor" className="text-gold underline-offset-4 hover:underline">Sponsor one</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto mt-24 max-w-6xl px-5">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">How a Boss Battle works</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative border-t border-gold/50 pt-6">
              <Sprite piece={s.piece} size={56} />
              <h3 className="mt-4 font-display text-xl font-bold">
                <span className="mr-2 text-gold">{i + 1}.</span>
                {s.title}
              </h3>
              <p className="mt-2 max-w-sm text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Sponsors */}
      <section className="mx-auto mt-24 max-w-6xl px-5">
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Put your name on the board</h2>
            <p className="mt-4 max-w-md text-muted">
              Sponsors fund the prizes and get a crowd that shows up, plays together and sees your brand every turn.
            </p>
            <Link href="/sponsor" className="mt-6 inline-block rounded-md bg-gold px-6 py-3 font-semibold text-black hover:bg-[#f0b96a]">
              See sponsor packages
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-panel p-5">
              <h3 className="font-display text-lg font-bold">Sponsored Event</h3>
              <p className="mt-1 text-gold">from Rp3.000.000 per event</p>
              <p className="mt-3 text-sm text-muted">One Boss Battle with your name, logo and prize text. Half of it goes to prizes for the top 10.</p>
            </div>
            <div className="rounded-xl border border-line bg-panel p-5">
              <h3 className="font-display text-lg font-bold">Season Sponsor</h3>
              <p className="mt-1 text-gold">from Rp10.000.000 per month</p>
              <p className="mt-3 text-sm text-muted">Your logo on every event and on the season leaderboard, plus a season prize pool.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Creators */}
      <section className="mx-auto mt-24 max-w-6xl px-5">
        <div className="flex flex-col gap-6 rounded-2xl border border-line bg-panel p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-5">
            <Sprite piece="rook" size={56} className="shrink-0" />
            <div>
              <h2 className="font-display text-2xl font-bold">Run a Boss Battle for your community</h2>
              <p className="mt-1 text-muted">Creator Pro is coming. Join the waitlist.</p>
            </div>
          </div>
          <Link href="/host" className="shrink-0 rounded-md border border-gold px-5 py-2.5 text-center font-medium text-gold transition-colors hover:bg-gold hover:text-black">
            Join the waitlist
          </Link>
        </div>
      </section>
    </>
  );
}
