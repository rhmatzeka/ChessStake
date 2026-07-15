import Link from 'next/link';

const SECTIONS = [
  {
    title: 'What is ChessStake?',
    body: 'ChessStake is a live AI chess arena. Players join White or Black, back a piece each turn, and watch the AI resolve the best legal move for the winning piece.',
  },
  {
    title: 'How turns work',
    body: 'Only the team whose turn it is can vote. If you joined Black and it is White turn, wait until Black turn comes back.',
  },
  {
    title: 'How voting works',
    body: 'Pick a legal piece type. The highest-backed legal piece controls the turn. Disabled pieces have no legal moves in the current board position.',
  },
  {
    title: 'What AI does',
    body: 'Chess rules are validated with chess.js. The AI strategy resolver chooses from legal moves only and updates the board after the timer ends.',
  },
  {
    title: 'What agents do',
    body: 'Your personal AI agent can recommend a piece to back. In MVP mode, recommendations are assistive and you stay in control before submitting.',
  },
  {
    title: 'Demo vs on-chain mode',
    body: 'The current MVP may use demo accounting unless on-chain betting is enabled. Mainnet real-money automation remains blocked for safety.',
  },
];

export default function HowToPlayPage() {
  return (
    <main className="min-h-screen bg-[#120d0a] px-4 py-10 text-[#f3dfbf] md:px-6">
      <div className="mx-auto max-w-5xl">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b58863]">New Player Guide</p>
        <h1 className="mt-2 text-4xl font-black">How to Play</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#f3dfbf]/65">
          Learn the arena loop before joining a live match: choose a team, back a legal piece, and let AI resolve the move.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {SECTIONS.map((section, index) => (
            <section key={section.title} className="rounded-2xl border border-[#b58863]/20 bg-[#211713] p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#b58863] font-black text-[#120d0a]">{index + 1}</span>
              <h2 className="mt-4 text-xl font-black">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#f3dfbf]/65">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/arena/live" className="rounded-xl bg-[#d6a15f] px-5 py-3 text-center font-black text-[#120d0a]">Enter Live Arena</Link>
          <Link href="/agents/create" className="rounded-xl border border-[#d6a15f]/40 px-5 py-3 text-center font-black text-[#f3dfbf]">Create Agent</Link>
          <Link href="/matches" className="rounded-xl border border-[#f3dfbf]/15 px-5 py-3 text-center font-black text-[#f3dfbf]/80">View Matches</Link>
        </div>
      </div>
    </main>
  );
}
