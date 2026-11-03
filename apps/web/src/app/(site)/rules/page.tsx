import type { Metadata } from "next";
import { PageHead } from "@/components/site/PageHead";

export const metadata: Metadata = {
  title: "Rules",
  description: "How a Boss Battle works, how points are scored, how prizes are decided, plus Terms and Privacy.",
};

const h2 = "display display-sm";

export default function Rules() {
  return (
    <>
      <PageHead kicker="Read before you play" title="Rules" lead="How to play, how points work, and how prizes are decided." />
      <div className="mx-auto grid max-w-6xl gap-14 px-5 pt-14 md:grid-cols-[14rem_1fr]">
        <nav aria-label="On this page" className="hidden md:block">
          <ul className="sticky top-6 grid gap-1 border-l border-line pl-4">
            <li><a href="#play" className="nav-link block">How to play</a></li>
            <li><a href="#points" className="nav-link block">Points</a></li>
            <li><a href="#fair" className="nav-link block">Fair choices</a></li>
            <li><a href="#prizes" className="nav-link block">Prizes</a></li>
            <li><a href="#terms" className="nav-link block">Terms</a></li>
            <li><a href="#privacy" className="nav-link block">Privacy</a></li>
          </ul>
        </nav>

        <div className="grid max-w-2xl gap-14 leading-7 [&_p]:text-[#c9c0b3]">
          <section id="play" className="scroll-mt-6 grid gap-4">
            <h2 className={h2}>How to play</h2>
            <p>The crowd plays White. The AI Boss plays Black. Every crowd turn shows 3 candidate moves on the board.</p>
            <p>You have 15 seconds to pick one. You can change your pick until the timer ends, and your last pick counts. The move with the most picks is played, then the Boss answers.</p>
            <p>If nobody picks, the okay move is played. If that happens 5 turns in a row, the event ends early. An event ends when the Boss is checkmated, the crowd is checkmated, the game is drawn, or the crowd reaches the move limit.</p>
            <p>Watching is free and needs no account. To pick, sign in with your wallet. Signing is only a message signature: no gas and no payment.</p>
          </section>

          <section id="points" className="scroll-mt-6 grid gap-4">
            <h2 className={h2}>Points</h2>
            <p>Each turn you pick, you get 10 points for showing up plus up to 100 more for the quality of your move:</p>
            <p className="panel px-4 py-3 font-mono text-sm font-bold text-foreground">
              points = 10 + round(100 × max(0, 1 − cpLoss / 300))
            </p>
            <p>
              cpLoss is how many centipawns (hundredths of a pawn) your pick is worse than the best of the 3 moves, according to the engine. The best move has a cpLoss of 0, so it scores the full 110 points. A move that is 150 centipawns worse scores 60. At 300 or more you only get the 10 for showing up.
            </p>
            <p>Every move is labeled after the turn, so you can learn from it:</p>
            <ul className="grid gap-2 text-[#c9c0b3]">
              <li><strong className="text-foreground">Best:</strong> less than 30 centipawns worse than the top move.</li>
              <li><strong className="text-foreground">Okay:</strong> 30 to 149 centipawns worse.</li>
              <li><strong className="text-foreground">Blunder:</strong> 150 centipawns worse or more.</li>
            </ul>
            <p>End bonus: if you picked in at least 5 turns, you get +500 points when the crowd wins (the Boss is checkmated) and +200 when the crowd survives (move limit reached or a draw). If the crowd loses, there is no bonus.</p>
            <p>Points count twice: for the event leaderboard, which decides that event&apos;s prizes, and for the season leaderboard, which covers a calendar month and resets on the 1st. Practice Arena points count for the season only.</p>
          </section>

          <section id="fair" className="scroll-mt-6 grid gap-4">
            <h2 className={h2}>Fair choices</h2>
            <p>The 3 candidates are picked by the engine, never by a person: its best move, an okay move that is clearly weaker, and a tempting trap that looks good but loses ground. They are shuffled, so the position on screen tells you nothing. Spotting the trap is the skill.</p>
            <p>Labels like &quot;Take the knight&quot; or &quot;Castle to safety&quot; come from simple rules, not from an AI that can make things up.</p>
          </section>

          <section id="prizes" className="scroll-mt-6 grid gap-4">
            <h2 className={h2}>Prizes</h2>
            <p>Sponsors put up the prizes. The top 10 of an event win them. To be eligible you must have picked in at least 10 turns of that event and not be disqualified.</p>
            <p>Winners are contacted through the wallet address they played with, so keep your display name and wallet in order. Prizes are sent by the sponsor or by PawnPool on the sponsor&apos;s behalf. Playing is always free.</p>
          </section>

          <section id="terms" className="scroll-mt-6 grid gap-4">
            <h2 className={h2}>Terms</h2>
            <ul className="grid list-disc gap-2 pl-5 text-[#c9c0b3]">
              <li>PawnPool is free to play. Nothing you do on the site costs money, and nothing is paid to play.</li>
              <li>Prizes are given by sponsors. PawnPool is not responsible for a sponsor&apos;s prize, but we will pass on the winners fairly.</li>
              <li>One wallet, one player. Using several wallets to collect points, scripts or bots to pick for you, or tampering with the site can get you disqualified.</li>
              <li>We may change, pause or cancel an event, and may remove any score we find was earned unfairly.</li>
              <li>The site is provided as is, and may be down sometimes.</li>
            </ul>
          </section>

          <section id="privacy" className="scroll-mt-6 grid gap-4">
            <h2 className={h2}>Privacy</h2>
            <ul className="grid list-disc gap-2 pl-5 text-[#c9c0b3]">
              <li>We store your wallet address, your display name if you set one, and the moves you pick with their points.</li>
              <li>Display names and points are public on leaderboards. If you do not set a name, a shortened wallet address is shown.</li>
              <li>We do not take payments and we do not store card or bank details.</li>
              <li>If you send a sponsor or creator form, we keep what you wrote so we can reply.</li>
              <li>We keep a session cookie so you stay signed in. We do not sell your data.</li>
              <li>To remove your name or data, contact us through the contact on the sponsor or host form.</li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
