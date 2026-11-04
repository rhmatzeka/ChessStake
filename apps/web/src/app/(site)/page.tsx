import Image from "next/image";
import Link from "next/link";
import { listEvents, type LobbyItem } from "@/server/events";
import { Countdown } from "@/components/site/Countdown";
import { formatWib } from "@/components/site/EventCard";
import { HeroVideo } from "@/components/site/HeroVideo";
import { Sprite } from "@/components/site/Sprite";
import { Board, type BoardArrow } from "@/components/arena/Board";
import { CandidateMark } from "@/components/arena/CandidateMark";
import { candidateLetter } from "@/components/arena/geometry";

export const revalidate = 60;

async function nextEvent(): Promise<LobbyItem | null> {
  try {
    const { live, upcoming } = await listEvents();
    return live.find((e) => !e.isPractice) ?? upcoming[0] ?? null;
  } catch {
    return null;
  }
}

// After 1.e4 e5 2.Nf3 Nc6: three moves, the crowd leans to the bishop.
const EXAMPLE_FEN = "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3";
const EXAMPLE = [
  { uci: "f1c4", label: "Develop the bishop", san: "Bc4", picks: 58 },
  { uci: "d2d4", label: "Push the center pawn", san: "d4", picks: 31 },
  { uci: "f3e5", label: "Take the pawn", san: "Nxe5", picks: 11 },
] as const;
const ARROWS: BoardArrow[] = EXAMPLE.map((m, i) => ({
  uci: m.uci,
  letter: candidateLetter(i),
  state: i === 0 ? "picked" : "normal",
}));

const STEPS = [
  {
    n: "01",
    word: "Pick",
    piece: "pawn",
    title: "1 of 3 moves",
    text: "Watch for free. Sign in with your wallet when you want to pick. No gas, no payment. Every turn shows three candidate moves.",
  },
  {
    n: "02",
    word: "Play",
    piece: "knight",
    title: "The crowd decides",
    text: "You have 15 seconds. The move the crowd picks most is the one that gets played. Then the AI Boss answers.",
  },
  {
    n: "03",
    word: "Win",
    piece: "queen",
    title: "Points and prizes",
    text: "Better moves score more points. The top 10 of an event win the prizes its sponsor puts up.",
  },
] as const;

export default async function Home() {
  const next = await nextEvent();
  const live = next?.status === "LIVE";

  return (
    <>
      {/* Hero */}
      <section className="relative isolate flex h-[calc(85svh-4.5rem)] min-h-[34rem] items-start justify-center pt-12 sm:items-center sm:pt-0 overflow-hidden bg-black md:h-[calc(100svh-4.5rem-3.25rem)] md:min-h-[36rem]">
        <div className="hero-media absolute inset-0 -z-20" aria-hidden="true">
          <div className="absolute inset-x-0 bottom-[6%] top-[40%] sm:inset-0">
          <Image
            src="/assets/hero/board.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-contain object-center sm:object-cover sm:object-[50%_45%]"
          />
          <HeroVideo />
          </div>
        </div>
        <div
          className="absolute inset-0 -z-10"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 50% 48%, rgb(7 6 5 / 0.38) 0%, rgb(7 6 5 / 0.62) 65%, rgb(7 6 5 / 0.92) 100%), linear-gradient(to bottom, rgb(7 6 5 / 0.5) 0%, transparent 25%, transparent 65%, #070605 100%)",
          }}
        />
        <div
          className="absolute inset-0 -z-10 sm:hidden"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 110% 42% at 50% 34%, rgb(7 6 5 / 0.9) 0%, rgb(7 6 5 / 0.62) 65%, transparent 100%), linear-gradient(to bottom, #070605 0%, rgb(7 6 5 / 0.55) 40%, transparent 62%)",
          }}
        />
        <div
          className="absolute inset-0 -z-10 hidden sm:block"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 52% 50% at 50% 50%, rgb(7 6 5 / 0.72) 0%, rgb(7 6 5 / 0.5) 55%, transparent 100%)",
          }}
        />
        <div className="grid-fine absolute inset-0 -z-10 opacity-60" aria-hidden="true" />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-5 text-center">
          <p className="rise pill" style={{ animationDelay: "0ms" }}>
            <span className="live-dot" aria-hidden="true" />
            Live crowd chess
          </p>
          <h1 className="display hero-shadow mt-6 text-[clamp(3rem,10.5vw,7.75rem)] leading-[0.86]">
            <span className="rise block" style={{ animationDelay: "120ms" }}>Your crowd</span>
            <span className="rise block" style={{ animationDelay: "220ms" }}>vs the</span>
            <span className="rise gold-text block" style={{ animationDelay: "320ms" }}>AI Boss</span>
          </h1>
          <p className="rise hero-shadow mt-7 max-w-md text-lg text-[#e6dfd3]" style={{ animationDelay: "480ms" }}>
            Free to play. Sponsors put up the prizes.
          </p>
          <div className="rise mt-9 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "600ms" }}>
            <Link href="/events/practice" className="btn btn-gold">Play now</Link>
            <Link href="#how" className="btn btn-glass">How it works</Link>
          </div>
        </div>
      </section>

      {/* Live strip */}
      <section aria-label="Live status" className="border-y border-line bg-[#0a0807]">
        <div className="mx-auto flex max-w-6xl flex-col gap-x-8 gap-y-1 px-5 py-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em] md:h-[3.25rem] md:flex-row md:items-center md:justify-between md:py-0">
          <Link href="/events/practice" className="flex items-center gap-3 hover:text-gold">
            <span className="live-dot" aria-hidden="true" />
            Practice Arena
            <span className="text-muted">Open all day</span>
          </Link>
          {next ? (
            <Link href={`/events/${next.slug}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 hover:text-gold">
              <span className="text-muted">{live ? "Live now" : "Next Boss Battle"}</span>
              <span className="truncate">{next.title}</span>
              {live ? (
                <span className="text-gold">Join</span>
              ) : (
                <span className="text-gold">
                  Starts in <Countdown target={Date.parse(next.startsAt)} />
                </span>
              )}
              {!live && <span className="hidden text-muted lg:inline">{formatWib(next.startsAt)}</span>}
            </Link>
          ) : (
            <p className="text-muted">Next Boss Battle coming soon</p>
          )}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-4 px-5 pt-24 md:pt-32">
        <p className="kicker">How a Boss Battle works</p>
        <h2 className="display display-md mt-4 max-w-3xl">Three moves. One crowd. One Boss.</h2>
        <ol className="mt-14 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="relative flex flex-col bg-panel p-7 md:p-8">
              <div className="flex items-start justify-between">
                <span className="numeral text-[6.5rem] md:text-[8rem]" aria-hidden="true">{s.n}</span>
                <Sprite piece={s.piece} size={56} />
              </div>
              <p className="kicker mt-8">
                <span className="sr-only">Step {s.n}: </span>
                {s.word}
              </p>
              <h3 className="display display-sm mt-3">{s.title}</h3>
              <p className="mt-4 text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Example turn */}
      <section className="mx-auto mt-24 max-w-6xl px-5 md:mt-32">
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:gap-14">
          <figure aria-label="Example of one turn" className="relative mx-auto w-full max-w-[34rem]">
            <div
              className="pointer-events-none absolute -inset-3 -z-10 md:-inset-8 opacity-80"
              aria-hidden="true"
              style={{ background: "radial-gradient(closest-side, rgb(230 168 85 / 0.18), transparent)" }}
            />
            <div className="panel p-2 sm:p-3">
              <Board fen={EXAMPLE_FEN} lastMove={null} animate={false} arrows={ARROWS} />
            </div>
            <figcaption className="kicker kicker-muted mt-3">Example turn. The crowd plays White.</figcaption>
          </figure>
          <div>
            <p className="kicker">The real arena</p>
            <h2 className="display display-md mt-4">See the three arrows. Choose one.</h2>
            <p className="mt-5 max-w-md text-muted">
              Each turn the engine offers its best move, an okay move and a tempting trap, shuffled. Spotting the trap is the skill.
            </p>
            <ul className="mt-8 grid gap-2.5">
              {EXAMPLE.map((m, i) => {
                const win = i === 0;
                return (
                  <li
                    key={m.uci}
                    className={`rounded-lg border px-4 py-3 ${win ? "border-gold bg-panel-hi ring-1 ring-gold" : "border-line bg-panel"}`}
                  >
                    <div className="flex items-start gap-3">
                      <CandidateMark letter={candidateLetter(i)} active={win} />
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-[1.05rem] font-bold leading-snug">{m.label}</p>
                        <p className="text-sm text-muted">{m.san}</p>
                      </div>
                      {win && <span className="rounded-full bg-gold px-2 py-0.5 font-mono text-[0.65rem] font-bold uppercase tracking-wider text-black">Crowd pick</span>}
                    </div>
                    <div className="mt-2.5 flex items-center gap-3">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                        <span className={`bar-fill block h-full rounded-full ${win ? "bg-gold" : "bg-gold/55"}`} style={{ width: `${m.picks}%` }} />
                      </span>
                      <span className="w-12 text-right font-mono text-xs tabular-nums text-muted">{m.picks}%</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* Sponsors */}
      <section className="photo-band mt-24 border-y border-line md:mt-32">
        <div className="photo-band-img" aria-hidden="true">
          <Image src="/assets/hero/flight.webp" alt="" fill sizes="100vw" className="object-cover" />
        </div>
        <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
          <p className="kicker">For sponsors</p>
          <h2 className="display display-md mt-4 max-w-3xl">Put your name on the board</h2>
          <p className="mt-5 max-w-lg text-lg text-[#d8d0c4]">
            Sponsors fund the prizes and get a crowd that shows up, plays together and sees your brand every turn.
          </p>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-line bg-black/70 p-6 backdrop-blur-sm">
              <p className="kicker">Sponsored Event</p>
              <p className="display display-sm mt-4 text-gold">From Rp3.000.000</p>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.18em] text-muted">per event</p>
              <p className="mt-4 text-[#c9c0b3]">One Boss Battle with your name, logo and prize text. Half of it goes to prizes for the top 10.</p>
            </div>
            <div className="rounded-lg border border-line bg-black/70 p-6 backdrop-blur-sm">
              <p className="kicker">Season Sponsor</p>
              <p className="display display-sm mt-4 text-gold">From Rp10.000.000</p>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.18em] text-muted">per month</p>
              <p className="mt-4 text-[#c9c0b3]">Your logo on every event and on the season leaderboard, plus a season prize pool.</p>
            </div>
          </div>
          <Link href="/sponsor" className="btn btn-gold mt-10">See sponsor packages</Link>
        </div>
      </section>

      {/* Creators */}
      <section className="mx-auto mt-24 max-w-6xl px-5 md:mt-32">
        <div className="photo-band panel-gold rounded-lg border">
          <div className="photo-band-img opacity-60" aria-hidden="true">
            <Image src="/assets/hero/settled.webp" alt="" fill sizes="(min-width: 1152px) 1152px, 100vw" className="object-cover" />
          </div>
          <div className="flex flex-col gap-8 p-8 md:flex-row md:items-center md:justify-between md:p-14">
            <div className="max-w-xl">
              <Sprite piece="rook" size={56} />
              <p className="kicker mt-6">For creators</p>
              <h2 className="display display-md mt-3">Run a Boss Battle for your community</h2>
              <p className="mt-4 text-[#d8d0c4]">Creator Pro is coming. Join the waitlist.</p>
            </div>
            <Link href="/host" className="btn btn-glass shrink-0">Join the waitlist</Link>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-6xl px-5 pt-24 text-center md:pt-32">
        <h2 className="display text-[clamp(2.4rem,8vw,6rem)]">
          The Boss is <span className="gold-text">waiting</span>
        </h2>
        <p className="mt-5 text-muted">The Practice Arena is open right now. No account needed to watch.</p>
        <Link href="/events/practice" className="btn btn-gold mt-8">Play now</Link>
      </section>
    </>
  );
}
